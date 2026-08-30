const pool = require('../src/shared/config/db');
const eventsModel = require('../src/features/events/events.model');
const feedbackModel = require('../src/features/feedback/feedback.model');

async function testCancellationAndPurge() {
  console.log('====================================================');
  console.log('  TESTING CANCELLATION & 10-MIN AUTO-PURGE LOGIC    ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, name) {
    if (condition) {
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${name}`);
      failed++;
    }
  }

  // 1. Create a test event
  const [userRes] = await pool.query('SELECT id FROM users WHERE role = "faculty" LIMIT 1');
  const facultyId = userRes[0].id;

  const [res] = await pool.query(`
    INSERT INTO events (title, description, event_date, event_time, location, category, organizing_department, created_by, status)
    VALUES ('Purge Test Event', 'Testing auto-purge and cancellation', '2026-09-10', '10:00:00', 'Hall A', 'Workshop', 'IT', ?, 'published')
  `, [facultyId]);
  const eventId = res.insertId;

  // 2. Mark event as cancelled with cancelled_at = 15 minutes ago (should be purged)
  await pool.query(`
    UPDATE events
    SET status = 'cancelled', cancellation_reason = 'Testing 10-min purge', cancelled_at = DATE_SUB(NOW(), INTERVAL 15 MINUTE)
    WHERE id = ?
  `, [eventId]);

  // 3. Create another event cancelled 2 minutes ago (should NOT be purged yet)
  const [resRecent] = await pool.query(`
    INSERT INTO events (title, description, event_date, event_time, location, category, organizing_department, created_by, status, cancellation_reason, cancelled_at)
    VALUES ('Recent Cancelled Event', 'Testing 10-min purge retention', '2026-09-10', '10:00:00', 'Hall A', 'Workshop', 'IT', ?, 'cancelled', 'Recent', DATE_SUB(NOW(), INTERVAL 2 MINUTE))
  `, [facultyId]);
  const recentEventId = resRecent.insertId;

  // 4. Run autoPurgeCancelledEvents()
  console.log('--- Running autoPurgeCancelledEvents() worker ---');
  await eventsModel.autoPurgeCancelledEvents();

  // 5. Verify the 15-min-old event is permanently purged
  const [purgedCheck] = await pool.query('SELECT id FROM events WHERE id = ?', [eventId]);
  assert(purgedCheck.length === 0, 'Event cancelled 15 minutes ago was permanently purged by auto-purge worker');

  // 6. Verify the 2-min-old event is still intact
  const [recentCheck] = await pool.query('SELECT id, status FROM events WHERE id = ?', [recentEventId]);
  assert(recentCheck.length === 1 && recentCheck[0].status === 'cancelled', 'Event cancelled 2 minutes ago is safely retained in 10-minute window');

  // Clean up recent test event
  await eventsModel.deleteEvent(recentEventId);

  console.log('\n====================================================');
  console.log(`  RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  process.exit(failed === 0 ? 0 : 1);
}

testCancellationAndPurge().catch((err) => {
  console.error(err);
  process.exit(1);
});
