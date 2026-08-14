const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authModel = require('./auth.model');

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
    const user = await authModel.findByEmail(email);
    if (!user || !user.password_hash) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.role === 'faculty' && user.approval_status !== 'approved') {
      return res.status(403).json({ message: `Faculty account is ${user.approval_status}` });
    }

    delete user.password_hash; // never send the hash back
    const token = signToken(user);
    res.json({ user, token });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
}

async function signupStudent(req, res) {
  try {
    const {
      fullName, email, phone, collegeName, courseMajor,
      facultyName, courseName, academicLevel, academicSemester, academicGroup, password,
    } = req.body;

    if (!fullName || !email || !collegeName || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const existing = await authModel.findByEmail(email);
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const isBic = !!(facultyName && courseName); // BIC/Herald/Fishtail branch sends these; Guest doesn't

    const user = await authModel.createStudent({
      fullName, email, phone, passwordHash,
      isBic, collegeName, courseMajor,
      facultyName, courseName, academicLevel, academicSemester, academicGroup,
    });

    res.status(201).json({ message: 'Account created successfully', user });
  } catch (err) {
    res.status(500).json({ message: 'Signup failed', error: err.message });
  }
}

async function signupFaculty(req, res) {
  try {
    const { fullName, email, phone, facultyIdCode, department, designation, community, password } = req.body;

    if (!fullName || !email || !facultyIdCode || !department || !designation || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const existing = await authModel.findByEmail(email);
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await authModel.createFaculty({
      fullName, email, phone, passwordHash,
      facultyIdCode, department, designation, community,
    });

    res.status(201).json({ message: 'Account created, pending admin approval', user });
  } catch (err) {
    res.status(500).json({ message: 'Signup failed', error: err.message });
  }
}

module.exports = { login, signupStudent, signupFaculty };