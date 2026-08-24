const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

// Fail fast at startup if credentials are missing/invalid, rather than
// discovering it only when the first email silently fails to send.
transporter.verify((err, success) => {
  if (err) {
    console.error('Mailer config error — emails will NOT send:', err.message);
  } else {
    console.log('Mailer ready to send emails');
  }
});

module.exports = transporter;