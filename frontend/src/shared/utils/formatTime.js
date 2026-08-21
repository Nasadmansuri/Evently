// frontend/src/shared/utils/formatTime.js

export function formatTime12hr(timeString) {
  if (!timeString) return '';
  const [hourStr, minute] = timeString.split(':');
  let hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  
  hour = hour % 12;
  hour = hour ? hour : 12; // the hour '0' should be '12'
  
  return `${hour}:${minute} ${ampm}`;
}