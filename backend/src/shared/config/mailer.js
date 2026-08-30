const nodemailer = require('nodemailer');

// Use explicit SMTP config with port 587 (STARTTLS) instead of the 'gmail'
// service shorthand which defaults to port 465 (implicit TLS / IPv6) —
// port 465 is blocked on Render's free tier causing ENETUNREACH errors.
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,       // false = STARTTLS (upgraded after connection)
  requireTLS: true,    // force TLS upgrade, reject plain connections
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
  tls: {
    // Allow modern TLS versions; keeps compatibility with Gmail servers
    minVersion: 'TLSv1.2',
  },
});

// Fail fast at startup if credentials are missing/invalid, rather than
// discovering it only when the first email silently fails to send.
transporter.verify((err, success) => {
  if (err) {
    console.error('Mailer config error — emails will NOT send:', err.message);
  } else {
    console.log('Mailer ready to send emails ✓');
  }
});

module.exports = transporter;