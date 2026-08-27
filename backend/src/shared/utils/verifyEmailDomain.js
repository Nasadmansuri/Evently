const dns = require('dns').promises;

const TRUSTED_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'outlook.com',
  'hotmail.com',
  'icloud.com',
  'bicnepal.edu.np',
  'bic.edu.np',
  'heraldcollege.edu.np',
  'heraldnepal.edu.np',
  'herald.edu.np',
  'fishtail.edu.np',
  'fishtailnepal.edu.np',
  'fishtailcollege.edu.np',
  'wlv.ac.uk',
  'tu.edu.np',
  'ku.edu.np',
  'pu.edu.np',
]);

/**
 * Verifies that the email domain exists and has active DNS/MX records on the internet.
 * @param {string} email
 * @returns {Promise<{ valid: boolean, message?: string }>}
 */
async function verifyEmailDomain(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, message: 'Email address is required' };
  }

  const parts = email.trim().toLowerCase().split('@');
  if (parts.length !== 2) {
    return { valid: false, message: 'Invalid email format' };
  }

  const [localPart, domain] = parts;

  if (!localPart || localPart.length > 64) {
    return { valid: false, message: 'Invalid username portion of email address' };
  }

  if (!domain || !domain.includes('.') || domain.length < 4) {
    return { valid: false, message: 'Invalid email domain' };
  }

  // Check valid domain characters
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)) {
    return { valid: false, message: 'Email domain contains invalid characters' };
  }

  if (TRUSTED_DOMAINS.has(domain)) {
    return { valid: true };
  }

  try {
    // Resolve MX records with a 3.5s timeout
    const mxPromise = dns.resolveMx(domain);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('DNS_TIMEOUT')), 3500)
    );

    const mxRecords = await Promise.race([mxPromise, timeoutPromise]);
    if (mxRecords && mxRecords.length > 0) {
      return { valid: true };
    }
  } catch (err) {
    if (err.message === 'DNS_TIMEOUT') {
      // In case of DNS timeout, attempt A-record resolution as fallback
      try {
        const aRecords = await dns.resolve(domain);
        if (aRecords && aRecords.length > 0) {
          return { valid: true };
        }
      } catch {
        return { valid: false, message: `Could not verify email server for @${domain} on the internet.` };
      }
    }

    if (err.code === 'ENOTFOUND' || err.code === 'NODATA' || err.code === 'SERVFAIL') {
      return {
        valid: false,
        message: `The domain @${domain} does not exist on the internet or has no active mail server.`,
      };
    }
  }

  return { valid: true };
}

module.exports = { verifyEmailDomain };
