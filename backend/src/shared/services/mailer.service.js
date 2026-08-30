const transporter = require('../config/mailer');

/**
 * Generic mail sender. Never throws — logs and swallows errors so that
 * a failed/slow email can never break or block the request that triggered it.
 */
async function sendMail({ to, subject, html }) {
  try {
    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'Evently'}" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Email sent to ${to}: "${subject}"`);
    }
  } catch (err) {
    console.error(`Failed to send email:`, err.message);
  }
}

/**
 * Formats a YYYY-MM-DD (or Date-parsable) value as DD/MM/YYYY.
 */
function formatDate(dateValue) {
  const d = new Date(dateValue);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Formats a "HH:MM:SS" (24-hour) time string as 12-hour with AM/PM.
 */
function formatTime(timeValue) {
  const [hourStr, minuteStr] = timeValue.split(':');
  let hour = parseInt(hourStr, 10);
  const minute = minuteStr;
  const period = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  return `${hour}:${minute} ${period}`;
}

/**
 * Builds the HTML body for a registration confirmation email.
 * teamName is optional — only pass it for team events.
 */
function buildRegistrationConfirmationEmail({
  studentName, eventTitle, eventDate, eventTime, location, category, teamName, eventId, organizerName,
}) {
  const teamRow = teamName
    ? `<p style="margin:8px 0;"><strong>Team:</strong> ${teamName}</p>`
    : '';
  const organizerRow = organizerName
    ? `<p style="margin:8px 0;">👤 <strong>Organizer:</strong> ${organizerName}</p>`
    : '';

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #16a34a;">✅ Registration Confirmed!</h2>
      <p>Hi ${studentName},</p>
      <p>Your registration for the following event is confirmed:</p>

      <div style="background:#f3f4f6; border-radius:8px; padding:16px 20px; margin:16px 0;">
        <h3 style="margin:0 0 12px 0;">${eventTitle}</h3>
        <p style="margin:8px 0;">📅 <strong>Date:</strong> ${formatDate(eventDate)}</p>
        <p style="margin:8px 0;">🕐 <strong>Time:</strong> ${formatTime(eventTime)}</p>
        <p style="margin:8px 0;">📍 <strong>Location:</strong> ${location}</p>
        <p style="margin:8px 0;">🏷️ <strong>Category:</strong> ${category}</p>
        ${organizerRow}
        ${teamRow}
      </div>

      <p>We look forward to seeing you there!</p>

      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/events/${eventId}" style="display:inline-block; background:#2563eb; color:#fff; text-decoration:none; padding:10px 20px; border-radius:6px; margin-top:8px;">
        View Event Details
      </a>
    </div>
  `;
}

module.exports = { sendMail, buildRegistrationConfirmationEmail };