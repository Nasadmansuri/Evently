export function isEventPast(eventDate) {
  return new Date(eventDate) < new Date(new Date().setHours(0, 0, 0, 0));
}

/**
 * Returns 'upcoming' | 'ongoing' | 'ended' based on actual start time,
 * not just date. An event starting 9am today is 'ongoing' by 10am, not
 * 'upcoming' - even though isEventPast() would still say it's not past
 * until midnight (there's no end-time field in the schema, so "ended"
 * stays date-based, same rule as before).
 */
export function getEventStatus(eventDate, eventTime) {
  const start = new Date(`${String(eventDate).slice(0, 10)}T${eventTime || '00:00:00'}`);
  const now = new Date();
  if (isEventPast(eventDate)) return 'ended';
  if (now >= start) return 'ongoing';
  return 'upcoming';
}