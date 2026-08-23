export function isEventPast(eventDate) {
  return new Date(eventDate) < new Date(new Date().setHours(0, 0, 0, 0));
}