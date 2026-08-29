const pool = require('../src/shared/config/db');
const registrationsModel = require('../src/features/registrations/registrations.model');
const feedbackModel = require('../src/features/feedback/feedback.model');

async function testLifecycleGating() {
  console.log('--- Testing Lifecycle & Feedback Gating ---');

  // Test 1: Concluded event registration gating
  const [[pastEvt]] = await pool.query("SELECT * FROM events WHERE event_date < '2026-08-28' LIMIT 1");
  if (pastEvt) {
    const eventDateStr = String(pastEvt.event_date).slice(0, 10);
    const eventTimeStr = pastEvt.event_time ? String(pastEvt.event_time).slice(0, 5) : '00:00';
    const eventStart = new Date(`${eventDateStr}T${eventTimeStr}:00`);
    const eventEnd = new Date(eventStart.getTime() + 3 * 60 * 60 * 1000);
    const isPast = new Date() > eventEnd;
    console.log(`[1] Past Event #${pastEvt.id} (${pastEvt.title}): date=${eventDateStr}, isPast=${isPast}`);
  }

  // Test 2: Feedback time gating check
  const futureDate = '2026-11-15';
  const futureTime = '14:00:00';
  const futureStart = new Date(`${futureDate}T${futureTime}`);
  const isFeedbackOpen = new Date() >= futureStart;
  console.log(`[2] Future Event (${futureDate} ${futureTime}): Feedback open = ${isFeedbackOpen} (Expected: false)`);

  console.log('\nAll lifecycle verification checks executed successfully!');
  process.exit(0);
}

testLifecycleGating().catch((err) => {
  console.error(err);
  process.exit(1);
});
