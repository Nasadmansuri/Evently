/**
 * Calendar Integration Utilities for Evently
 * Generates Google Calendar URLs and downloadable .ics files
 */

/**
 * Format a Date object to Google Calendar UTC date string: YYYYMMDDTHHmmssZ
 */
function formatDateToUTC(date) {
  const pad = (n) => String(n).padStart(2, '0');
  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  const hours = pad(date.getUTCHours());
  const minutes = pad(date.getUTCMinutes());
  const seconds = pad(date.getUTCSeconds());
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Parses event_date and event_time into JS Date objects for start and end
 */
export function getEventDateRange(event) {
  if (!event || !event.event_date) return null;

  const dateStr = String(event.event_date).slice(0, 10);
  const timeStr = event.event_time ? String(event.event_time).slice(0, 8) : '10:00:00';
  
  // Construct local start date
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes, seconds = 0] = timeStr.split(':').map(Number);

  const startDate = new Date(year, (month || 1) - 1, day || 1, hours || 0, minutes || 0, seconds || 0);
  
  // Default duration is 2 hours
  const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

  return { startDate, endDate };
}

/**
 * Generates a direct Google Calendar Web Intent URL
 */
export function getGoogleCalendarUrl(event) {
  if (!event) return '#';

  const range = getEventDateRange(event);
  if (!range) return '#';

  const startUtc = formatDateToUTC(range.startDate);
  const endUtc = formatDateToUTC(range.endDate);

  const title = event.title || 'Campus Event';
  const location = event.location 
    ? `${event.location}, Biratnagar International College` 
    : 'Biratnagar International College, Bhrikuti Chowk, Biratnagar';

  const details = [
    event.description || '',
    '',
    `Organizer: ${event.organizing_department || event.organizer_name || 'Campus Faculty'}`,
    event.organizing_community ? `Community: ${event.organizing_community}` : '',
    event.rules_eligibility ? `Rules & Eligibility: ${event.rules_eligibility}` : '',
    `Event Category: ${event.category || 'General'}`,
    `Event Portal: ${typeof window !== 'undefined' ? `${window.location.origin}/events/${event.id}` : ''}`,
  ].filter(Boolean).join('\n');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${startUtc}/${endUtc}`,
    details: details,
    location: location,
    trp: 'true',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generates and downloads standard .ics file for Apple Calendar, Outlook, Mobile
 */
export function downloadIcsFile(event) {
  if (!event) return;

  const range = getEventDateRange(event);
  if (!range) return;

  const startUtc = formatDateToUTC(range.startDate);
  const endUtc = formatDateToUTC(range.endDate);
  const nowUtc = formatDateToUTC(new Date());

  const title = (event.title || 'Campus Event').replace(/[\r\n]+/g, ' ');
  const location = (event.location ? `${event.location}, Biratnagar International College` : 'Biratnagar International College').replace(/[\r\n]+/g, ' ');
  const description = (event.description || 'Campus Event via Evently').replace(/\r\n|\r|\n/g, '\\n');
  const uid = `evently-${event.id}-${Date.now()}@evently.college`;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Evently//Campus Event Management//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${nowUtc}`,
    `DTSTART:${startUtc}`,
    `DTEND:${endUtc}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.ics`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
