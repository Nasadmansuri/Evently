export function isEventPast(eventDate, eventTime) {
  if (!eventDate) return false;
  const dateStr = String(eventDate).slice(0, 10);
  const d = new Date(`${dateStr}T23:59:59`);
  return d < new Date();
}

/**
 * Returns 'cancelled' | 'scheduled' | 'upcoming' | 'ongoing' | 'ended' based on actual start time,
 * scheduled publish time, and date.
 */
export function getEventStatus(eventDate, eventTime, status, publishAt) {
  if (status === 'cancelled') {
    return 'cancelled';
  }
  if (status === 'scheduled' || (publishAt && new Date(publishAt) > new Date())) {
    return 'scheduled';
  }
  const dateStr = String(eventDate).slice(0, 10);
  const timeStr = eventTime ? String(eventTime).slice(0, 5) : '00:00';
  const start = new Date(`${dateStr}T${timeStr}:00`);
  const now = new Date();

  // If start is in the past, treat as ongoing until midnight of the event's
  // own date, then ended - not a fixed 2-hour window.
  if (now >= start) {
    const endOfDay = new Date(`${dateStr}T23:59:59`);
    if (now > endOfDay) return 'ended';
    return 'ongoing';
  }
  return 'upcoming';
}