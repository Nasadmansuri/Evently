const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authModel = require('./auth.model');
const pool = require('../../shared/config/db');
const notificationsModel = require('../notifications/notifications.model');
const { verifyEmailDomain } = require('../../shared/utils/verifyEmailDomain');
const { sendMail } = require('../../shared/services/mailer.service');

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, approval_status: user.approval_status },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    const normalizedEmail = (email || '').trim().toLowerCase();
    const user = await authModel.findByEmail(normalizedEmail);
    if (!user || !user.password_hash) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.is_active === 0) {
      return res.status(403).json({
        message: 'Your account has been deactivated by campus administration.',
        reason: user.deactivation_reason || 'Administrative decision or violation of campus guidelines.',
        isDeactivated: true,
      });
    }

    if (user.role === 'faculty' && user.approval_status !== 'approved') {
      const status = user.approval_status || 'pending';
      return res.status(403).json({
        message: status === 'pending' ? 'Faculty account is pending admin approval' : 'Faculty account has been rejected',
      });
    }

    delete user.password_hash; // never send the hash back
    const token = signToken(user);
    res.json({ user, token });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
}

async function sendSignupOtp(req, res) {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ message: 'Valid email address is required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const domainCheck = await verifyEmailDomain(normalizedEmail);
    if (!domainCheck.valid) {
      return res.status(400).json({ message: domainCheck.message });
    }

    const existing = await authModel.findByEmail(normalizedEmail);
    if (existing) {
      if (existing.is_active === 0) {
        return res.status(403).json({
          message: 'This account has been deactivated by campus administration and cannot be re-registered.',
          reason: existing.deactivation_reason || 'Administrative review and policy compliance.',
          isDeactivated: true,
        });
      }
      return res.status(409).json({ message: 'An account with this email already exists. Please log in.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes validity
    await authModel.saveEmailVerificationOtp(normalizedEmail, otp, expiresAt);

    // Send email via Brevo HTTPS API
    try {
      await sendMail({
        to: normalizedEmail,
        subject: `Evently — Email Verification Code: ${otp}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #035352; margin: 0;">Evently</h2>
              <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Smart Campus Event Management</p>
            </div>
            <p style="color: #334155; font-size: 14px;">Hello,</p>
            <p style="color: #475569; font-size: 14px; line-height: 1.6;">
              Please use the verification code below to verify your email address and complete your Evently registration:
            </p>
            <div style="text-align: center; margin: 28px 0;">
              <span style="display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #035352; background: #f0fdf4; padding: 12px 28px; border-radius: 8px; border: 1px dashed #035352;">
                ${otp}
              </span>
            </div>
            <p style="color: #64748b; font-size: 12px; line-height: 1.5;">
              This code will expire in 15 minutes. If you did not request this code, please ignore this email.
            </p>
          </div>
        `,
      });
    } catch (mailErr) {
      console.error('Could not send signup verification email:', mailErr.message);
    }

    res.json({
      message: 'A 6-digit verification code has been sent to your email.',
      email: normalizedEmail,
    });
  } catch (err) {
    console.error('Send signup OTP error:', err);
    res.status(500).json({ message: 'Failed to send verification code', error: err.message });
  }
}

async function signupStudent(req, res) {
  try {
    const {
      fullName, email, phone, collegeName, courseMajor,
      facultyName, courseName, academicLevel, academicSemester, academicGroup, password, otp,
    } = req.body;

    if (!fullName || !email || !phone || !collegeName || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const domainCheck = await verifyEmailDomain(normalizedEmail);
    if (!domainCheck.valid) {
      return res.status(400).json({ message: domainCheck.message });
    }

    const existing = await authModel.findByEmail(normalizedEmail);
    if (existing) {
      if (existing.is_active === 0) {
        return res.status(403).json({
          message: 'This account has been deactivated by campus administration and cannot be re-registered.',
          reason: existing.deactivation_reason || 'Administrative policy review.',
          isDeactivated: true,
        });
      }
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    if (otp) {
      const stored = await authModel.getEmailVerificationOtp(normalizedEmail);
      if (!stored || String(stored.otp).trim() !== String(otp).trim()) {
        return res.status(400).json({ message: 'Invalid or incorrect verification code' });
      }
      if (Date.now() > Number(stored.expires_at)) {
        await authModel.deleteEmailVerificationOtp(normalizedEmail);
        return res.status(400).json({ message: 'Verification code has expired. Please request a new code.' });
      }
      await authModel.deleteEmailVerificationOtp(normalizedEmail);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const isBic = !!(facultyName && courseName); // BIC/Herald/Fishtail branch sends these; Guest doesn't

    const user = await authModel.createStudent({
      fullName: fullName.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      passwordHash,
      isBic,
      collegeName,
      courseMajor,
      facultyName,
      courseName,
      academicLevel,
      academicSemester,
      academicGroup,
    });

    delete user.password_hash;
    const token = signToken(user);
    res.status(201).json({ message: 'Account created successfully', user, token });
  } catch (err) {
    res.status(500).json({ message: 'Signup failed', error: err.message });
  }
}

async function signupFaculty(req, res) {
  try {
    const { fullName, email, phone, facultyIdCode, department, designation, community, password, otp } = req.body;

    if (!fullName || !email || !phone || !facultyIdCode || !department || !designation || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const domainCheck = await verifyEmailDomain(normalizedEmail);
    if (!domainCheck.valid) {
      return res.status(400).json({ message: domainCheck.message });
    }

    const existing = await authModel.findByEmail(normalizedEmail);
    if (existing) {
      if (existing.is_active === 0) {
        return res.status(403).json({
          message: 'This account has been deactivated by campus administration and cannot be re-registered.',
          reason: existing.deactivation_reason || 'Administrative policy review.',
          isDeactivated: true,
        });
      }
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    if (otp) {
      const stored = await authModel.getEmailVerificationOtp(normalizedEmail);
      if (!stored || String(stored.otp).trim() !== String(otp).trim()) {
        return res.status(400).json({ message: 'Invalid or incorrect verification code' });
      }
      if (Date.now() > Number(stored.expires_at)) {
        await authModel.deleteEmailVerificationOtp(normalizedEmail);
        return res.status(400).json({ message: 'Verification code has expired. Please request a new code.' });
      }
      await authModel.deleteEmailVerificationOtp(normalizedEmail);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await authModel.createFaculty({
      fullName: fullName.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      passwordHash,
      facultyIdCode: facultyIdCode.trim().toUpperCase(),
      department,
      designation,
      community,
    });

    delete user.password_hash;
    res.status(201).json({ message: 'Account created, pending admin approval', user });

    // Notify all campus administrators about the new faculty registration
    pool.query('SELECT id FROM users WHERE role = "admin"')
      .then(([admins]) => {
        const adminIds = admins.map((a) => a.id);
        if (adminIds.length > 0) {
          return notificationsModel.createForUsers(adminIds, {
            title: `New Faculty Registration: ${fullName.trim()}`,
            message: `${fullName.trim()} (${department} · ${designation}) registered as faculty and is awaiting admin approval.`,
            link: '/admin/dashboard',
          });
        }
      })
      .catch((err) => console.error('Admin faculty signup notification failed:', err.message));
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      const message = err.sqlMessage.includes('email')
        ? 'An account with this email already exists'
        : 'This Faculty ID is already registered';
      return res.status(409).json({ message });
    }
    res.status(500).json({ message: 'Signup failed', error: err.message });
  }
}

const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function resolveAffiliatedCollegeByEmail(email, hd) {
  const normalized = (email || '').toLowerCase().trim();
  const domain = normalized.split('@')[1] || '';
  const hostedDomain = (hd || '').toLowerCase().trim();

  // Biratnagar International College (BIC) domains (e.g. bicnepal.edu.np, bic.edu.np)
  if (
    domain === 'bicnepal.edu.np' ||
    domain === 'bic.edu.np' ||
    domain.includes('bicnepal') ||
    hostedDomain === 'bicnepal.edu.np' ||
    hostedDomain === 'bic.edu.np' ||
    domain.endsWith('.bicnepal.edu.np') ||
    domain.endsWith('.bic.edu.np')
  ) {
    return { isAffiliated: true, collegeName: 'Biratnagar International College' };
  }

  // Herald College Kathmandu domains
  if (
    domain === 'heraldcollege.edu.np' ||
    domain === 'herald.edu.np' ||
    domain === 'heraldnepal.edu.np' ||
    domain.includes('heraldcollege') ||
    hostedDomain === 'heraldcollege.edu.np' ||
    hostedDomain === 'heraldnepal.edu.np' ||
    domain.endsWith('.heraldcollege.edu.np') ||
    domain.endsWith('.herald.edu.np')
  ) {
    return { isAffiliated: true, collegeName: 'Herald College Kathmandu' };
  }

  // Fishtail Academy / College domains
  if (
    domain === 'fishtail.edu.np' ||
    domain === 'fishtailcollege.edu.np' ||
    domain === 'fishtailnepal.edu.np' ||
    domain.includes('fishtail') ||
    hostedDomain === 'fishtail.edu.np' ||
    hostedDomain === 'fishtailcollege.edu.np' ||
    domain.endsWith('.fishtail.edu.np') ||
    domain.endsWith('.fishtailcollege.edu.np')
  ) {
    return { isAffiliated: true, collegeName: 'Fishtail Academy' };
  }

  // Other educational institution domains (.edu or .edu.np)
  if (domain.endsWith('.edu.np') || domain.endsWith('.edu')) {
    const orgName = domain.replace(/(\.edu\.np|\.edu)$/, '').toUpperCase();
    return { isAffiliated: false, collegeName: `${orgName} College` };
  }

  return { isAffiliated: false, collegeName: 'Guest' };
}

async function googleLogin(req, res) {
  try {
    const { credential, demoUser } = req.body;

    let payload;

    if (demoUser) {
      // Support interactive demo selector for presentation / offline dev
      payload = {
        email: demoUser.email,
        sub: demoUser.googleId || `demo_gid_${Date.now()}`,
        name: demoUser.name || demoUser.email.split('@')[0],
        picture: demoUser.picture || null,
        hd: demoUser.email.split('@')[1] || undefined,
        email_verified: true,
      };
    } else {
      if (!credential) {
        return res.status(400).json({ message: 'Google credential is required' });
      }

      try {
        const ticket = await googleClient.verifyIdToken({
          idToken: credential,
          audience: process.env.GOOGLE_CLIENT_ID || undefined,
        });
        payload = ticket.getPayload();
      } catch (verifyErr) {
        // If client ID is not configured in .env, check if credential contains encoded demo payload
        if (!process.env.GOOGLE_CLIENT_ID) {
          try {
            const decoded = JSON.parse(Buffer.from(credential, 'base64').toString('utf8'));
            if (decoded && decoded.email) {
              payload = {
                email: decoded.email,
                sub: decoded.googleId || `google_${Date.now()}`,
                name: decoded.name || decoded.email.split('@')[0],
                picture: decoded.picture || null,
                hd: decoded.email.split('@')[1] || undefined,
                email_verified: true,
              };
            }
          } catch (e) {}
        }

        if (!payload) {
          return res.status(401).json({ message: 'Invalid or expired Google token', error: verifyErr.message });
        }
      }
    }

    if (!payload || !payload.email) {
      return res.status(400).json({ message: 'Google account does not contain an email address' });
    }

    if (!payload.email_verified) {
      return res.status(400).json({ message: 'Google email address is not verified' });
    }

    const { email, sub: googleId, name: fullName, picture: avatarUrl, hd } = payload;

    const domainCheck = await verifyEmailDomain(email);
    if (!domainCheck.valid) {
      return res.status(400).json({ message: domainCheck.message });
    }

    // Check if user exists by google_id or by email
    let user = await authModel.findByGoogleId(googleId);
    if (!user) {
      user = await authModel.findByEmail(email);
      if (user) {
        // Link Google ID and avatar
        user = await authModel.updateGoogleAuth(user.id, { googleId, avatarUrl });
      }
    }

    // If user already exists, log them in directly
    if (user) {
      if (user.is_active === 0) {
        return res.status(403).json({
          message: 'Your account has been deactivated by campus administration.',
          reason: user.deactivation_reason || 'Administrative decision or violation of campus guidelines.',
          isDeactivated: true,
        });
      }

      if (user.role === 'faculty' && user.approval_status !== 'approved') {
        const status = user.approval_status || 'pending';
        return res.status(403).json({
          message: status === 'pending' ? 'Faculty account is pending admin approval' : 'Faculty account has been rejected',
        });
      }

      delete user.password_hash;
      const token = signToken(user);
      return res.json({ isNewUser: false, user, token, message: 'Google sign-in successful' });
    }

    // If user is NEW, resolve affiliation and request academic onboarding details
    const affiliation = resolveAffiliatedCollegeByEmail(email, hd);
    return res.json({
      isNewUser: true,
      googleUser: {
        email,
        googleId,
        fullName: fullName || email.split('@')[0],
        avatarUrl: avatarUrl || null,
        isAffiliated: affiliation.isAffiliated,
        collegeName: affiliation.collegeName,
      },
    });
  } catch (err) {
    console.error('Google login error:', err);
    res.status(500).json({ message: 'Google sign-in failed', error: err.message });
  }
}

async function completeGoogleSignup(req, res) {
  try {
    const {
      googleUser, phone, collegeName,
      facultyName, courseName, academicLevel, academicSemester, academicGroup, courseMajor,
    } = req.body;

    if (!googleUser || !googleUser.email || !googleUser.googleId) {
      return res.status(400).json({ message: 'Google authentication data missing' });
    }
    if (!phone || !/^9\d{9}$/.test(phone.trim())) {
      return res.status(400).json({ message: 'Please enter a valid 10-digit phone number (starting with 9)' });
    }
    if (!collegeName || !collegeName.trim()) {
      return res.status(400).json({ message: 'College name is required' });
    }

    const email = googleUser.email.trim().toLowerCase();
    const isAffiliated = !!(facultyName && courseName);

    if (isAffiliated) {
      if (!facultyName || !courseName || !academicLevel || !academicSemester || !academicGroup) {
        return res.status(400).json({ message: 'Please complete all academic details' });
      }
    } else {
      const lowerCollege = collegeName.toLowerCase().trim();
      if (
        lowerCollege.includes('biratnagar international') ||
        lowerCollege === 'bic' ||
        lowerCollege.includes('bicnepal') ||
        lowerCollege.includes('bic nepal') ||
        lowerCollege.includes('herald college') ||
        lowerCollege === 'herald' ||
        lowerCollege.includes('fishtail')
      ) {
        return res.status(400).json({
          message:
            'Students of affiliated colleges (BIC, Herald, Fishtail) must sign in using their official college email. For guest registrations, please enter your external college name.',
        });
      }

      if (!courseMajor || !courseMajor.trim()) {
        return res.status(400).json({ message: 'Please enter your course/major' });
      }
    }

    // Double check if account was created concurrently or was deactivated
    let user = await authModel.findByEmail(email);
    if (user) {
      if (user.is_active === 0) {
        return res.status(403).json({
          message: 'Your account has been deactivated by campus administration.',
          reason: user.deactivation_reason || 'Administrative decision or violation of campus guidelines.',
          isDeactivated: true,
        });
      }
    } else {
      const resolvedName = (req.body.fullName || googleUser.fullName || email.split('@')[0]).trim();
      user = await authModel.createGoogleStudent({
        fullName: resolvedName,
        email,
        phone: phone.trim(),
        googleId: googleUser.googleId,
        avatarUrl: googleUser.avatarUrl || null,
        isAffiliated,
        collegeName: collegeName.trim(),
        facultyName: isAffiliated ? facultyName : undefined,
        courseName: isAffiliated ? courseName : undefined,
        academicLevel: isAffiliated ? academicLevel : undefined,
        academicSemester: isAffiliated ? academicSemester : undefined,
        academicGroup: isAffiliated ? academicGroup : undefined,
        courseMajor: !isAffiliated ? courseMajor.trim() : undefined,
      });
    }

    if (user.is_active === 0) {
      return res.status(403).json({
        message: 'Your account has been deactivated by campus administration.',
        reason: user.deactivation_reason || 'Administrative decision or violation of campus guidelines.',
        isDeactivated: true,
      });
    }

    delete user.password_hash;
    const token = signToken(user);
    res.status(201).json({ message: 'Account created successfully! Welcome to Evently.', user, token });
  } catch (err) {
    console.error('Complete Google signup error:', err);
    res.status(500).json({ message: 'Failed to complete Google account registration', error: err.message });
  }
}

async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email address is required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const domainCheck = await verifyEmailDomain(normalizedEmail);
    if (!domainCheck.valid) {
      return res.status(400).json({ message: domainCheck.message });
    }

    const user = await authModel.findByEmail(normalizedEmail);
    if (!user) {
      // Don't reveal if user doesn't exist for security, but return generic success message
      return res.json({ message: 'If an account exists with this email, a reset code has been sent.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes validity
    await authModel.savePasswordResetOtp(normalizedEmail, otp, expiresAt);

    // Send email via Brevo HTTPS API
    try {
      await sendMail({
        to: normalizedEmail,
        subject: `Evently — Password Reset Code: ${otp}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #035352; margin: 0;">Evently</h2>
              <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Smart Campus Event Management</p>
            </div>
            <p style="color: #334155; font-size: 14px;">Hello <strong>${user.full_name}</strong>,</p>
            <p style="color: #475569; font-size: 14px; line-height: 1.6;">
              We received a request to reset your Evently password. Use the verification code below to complete the reset:
            </p>
            <div style="text-align: center; margin: 28px 0;">
              <span style="display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #035352; background: #f0fdf4; padding: 12px 28px; border-radius: 8px; border: 1px dashed #035352;">
                ${otp}
              </span>
            </div>
            <p style="color: #64748b; font-size: 12px; line-height: 1.5;">
              This code will expire in 15 minutes. If you did not request a password reset, please ignore this email.
            </p>
          </div>
        `,
      });
    } catch (mailErr) {
      console.error('Could not send password reset email:', mailErr.message);
    }

    res.json({
      message: 'A 6-digit verification code has been sent to your email.',
      email: normalizedEmail,
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Failed to process password reset request', error: err.message });
  }
}

async function resetPassword(req, res) {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, verification code, and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const stored = await authModel.getPasswordResetOtp(normalizedEmail);

    if (!stored || String(stored.otp).trim() !== String(otp).trim()) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    if (Date.now() > Number(stored.expires_at)) {
      await authModel.deletePasswordResetOtp(normalizedEmail);
      return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const updated = await authModel.updatePasswordByEmail(normalizedEmail, passwordHash);

    if (!updated) {
      return res.status(404).json({ message: 'User account not found' });
    }

    // Clear used OTP from database
    await authModel.deletePasswordResetOtp(normalizedEmail);

    res.json({ message: 'Password has been reset successfully. You can now log in.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Failed to reset password', error: err.message });
  }
}

module.exports = {
  login,
  sendSignupOtp,
  signupStudent,
  signupFaculty,
  googleLogin,
  completeGoogleSignup,
  forgotPassword,
  resetPassword,
};