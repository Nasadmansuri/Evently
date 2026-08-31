// Brevo (formerly Sendinblue) HTTPS Email API Config
// Uses standard HTTPS (Port 443) to bypass Render free-tier outbound SMTP port restrictions (25/465/587).
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

const apiKey = process.env.BREVO_API_KEY;
if (!apiKey) {
  console.warn('[MAILER]: BREVO_API_KEY is not configured in environment. Outbound emails will be skipped.');
} else {
  console.log('Brevo HTTPS Mailer initialized ✓');
}

module.exports = {
  BREVO_API_URL,
  getApiKey: () => process.env.BREVO_API_KEY,
  getDefaultSender: () => ({
    name: process.env.EMAIL_FROM_NAME || 'Evently',
    email: process.env.EMAIL_FROM || 'evently.nexora@gmail.com',
  }),
};