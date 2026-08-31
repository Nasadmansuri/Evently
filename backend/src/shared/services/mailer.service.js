const { BREVO_API_URL, getApiKey, getDefaultSender } = require('../config/mailer');

/**
 * Generic mail sender using Brevo HTTPS REST API.
 * Never throws — logs and swallows errors so that
 * a failed/slow email can never break or block the request that triggered it.
 */
async function sendMail({ to, subject, html }) {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      console.warn(`[MAILER]: BREVO_API_KEY not configured. Skipped email to ${to}: "${subject}"`);
      return;
    }

    const sender = getDefaultSender();
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender,
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error(`[MAILER ERROR]: Brevo HTTP ${response.status} failed for ${to}:`, result.message || JSON.stringify(result));
      return;
    }

    console.log(`[MAILER]: Email delivered via Brevo to ${to}: "${subject}" (MessageID: ${result.messageId || 'OK'})`);
  } catch (err) {
    console.error(`[MAILER ERROR]: Failed to send email to ${to}:`, err.message);
  }
}

/**
 * Formats a YYYY-MM-DD (or Date-parsable) value as DD/MM/YYYY.
 */
function formatDate(dateValue) {
  if (!dateValue) return 'TBA';
  try {
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return String(dateValue);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return String(dateValue);
  }
}

/**
 * Formats a "HH:MM:SS" (24-hour) time string as 12-hour with AM/PM.
 */
function formatTime(timeValue) {
  if (!timeValue) return 'TBA';
  try {
    const str = String(timeValue).trim();
    const parts = str.split(':');
    if (parts.length < 2) return str;
    let hour = parseInt(parts[0], 10);
    const minute = parts[1];
    if (isNaN(hour)) return str;
    const period = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return `${hour}:${minute} ${period}`;
  } catch {
    return String(timeValue);
  }
}

/**
 * Builds the HTML body for a registration confirmation email.
 * teamName is optional — only pass it for team events.
 */
function buildRegistrationConfirmationEmail({
  studentName, eventTitle, eventDate, eventTime, location, category, teamName, eventId, organizerName,
}) {
  const teamRow = teamName
    ? `<p style="margin:8px 0; font-size: 13px; color: #334155;">👥 <strong>Team:</strong> ${teamName}</p>`
    : '';
  const organizerRow = organizerName
    ? `<p style="margin:8px 0; font-size: 13px; color: #334155;">👤 <strong>Organizer:</strong> ${organizerName}</p>`
    : '';
  const frontendBase = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',')[0].trim();

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #035352; margin: 0;">Evently</h2>
        <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Smart Campus Event Management</p>
      </div>

      <div style="padding: 16px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #166534; margin: 0 0 4px 0; font-size: 16px;">✅ Registration Confirmed!</h3>
        <p style="color: #15803d; font-size: 13px; margin: 0;">Hi ${studentName || 'Student'}, your registration is locked in.</p>
      </div>

      <div style="background:#f8fafc; border: 1px solid #e2e8f0; border-radius:8px; padding:16px 20px; margin:16px 0;">
        <h3 style="margin:0 0 12px 0; color: #0f172a; font-size: 16px;">${eventTitle || 'Campus Event'}</h3>
        <p style="margin:8px 0; font-size: 13px; color: #334155;">📅 <strong>Date:</strong> ${formatDate(eventDate)}</p>
        <p style="margin:8px 0; font-size: 13px; color: #334155;">🕐 <strong>Time:</strong> ${formatTime(eventTime)}</p>
        <p style="margin:8px 0; font-size: 13px; color: #334155;">📍 <strong>Location:</strong> ${location || 'Campus'}</p>
        <p style="margin:8px 0; font-size: 13px; color: #334155;">🏷️ <strong>Category:</strong> ${category || 'General'}</p>
        ${organizerRow}
        ${teamRow}
      </div>

      <p style="color: #475569; font-size: 13px; line-height: 1.5;">We look forward to your participation!</p>

      ${eventId ? `
      <div style="margin-top: 20px; text-align: center;">
        <a href="${frontendBase}/events/${eventId}" style="display:inline-block; background:#035352; color:#ffffff; text-decoration:none; padding:10px 24px; border-radius:6px; font-size: 13px; font-weight: bold;">
          View Event Details
        </a>
      </div>` : ''}
    </div>
  `;
}

module.exports = { sendMail, buildRegistrationConfirmationEmail };