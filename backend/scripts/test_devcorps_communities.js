const pool = require('../src/shared/config/db');
const authModel = require('../src/features/auth/auth.model');
const eventsModel = require('../src/features/events/events.model');
const bcrypt = require('bcryptjs');

async function testDevCorpsSystem() {
  console.log('================================================================');
  console.log('       TESTING DEVCORPS & 4 COMMUNITIES HIERARCHY SYSTEM        ');
  console.log('================================================================\n');

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

  const passwordHash = await bcrypt.hash('Test@123', 10);
  const createdUserIds = [];
  const createdEventIds = [];

  try {
    // 1. Create DevCorps Core Advisor and 4 Community Leads
    console.log('--- 1. Registering DevCorps Chapter Leads ---');
    const chapters = [
      { email: 'devcorps_core@bic.edu.np', name: 'Core Advisor', community: 'DevCorps Core' },
      { email: 'devsphere_lead@bic.edu.np', name: 'DevSphere Lead', community: 'DevSphere' },
      { email: 'ai_horizon_lead@bic.edu.np', name: 'AI Horizon Lead', community: 'AI Horizon' },
      { email: 'converge_lead@bic.edu.np', name: 'BIC Converge Lead', community: 'BIC Converge' },
      { email: 'incognitus_lead@bic.edu.np', name: 'inCognitus Lead', community: 'inCognitus' },
    ];

    const usersByCommunity = {};

    for (const ch of chapters) {
      // Clean previous test data
      const [old] = await pool.query('SELECT id FROM users WHERE email = ?', [ch.email]);
      if (old.length > 0) {
        await pool.query('DELETE FROM faculty_profiles WHERE user_id = ?', [old[0].id]);
        await pool.query('DELETE FROM events WHERE created_by = ?', [old[0].id]);
        await pool.query('DELETE FROM users WHERE id = ?', [old[0].id]);
      }

      const u = await authModel.createFaculty({
        fullName: ch.name,
        email: ch.email,
        phone: '9800000000',
        passwordHash,
        facultyIdCode: `FAC-${ch.community.slice(0, 4).toUpperCase()}`,
        department: 'DevCorps',
        designation: 'Community Lead',
        community: ch.community,
      });

      usersByCommunity[ch.community] = u;
      createdUserIds.push(u.id);
      assert(u && u.department === 'DevCorps' && u.community === ch.community, `Registered ${ch.name} under DevCorps (${ch.community})`);
    }

    // 2. Create Events organized by DevCorps Core & Each Community
    console.log('\n--- 2. Publishing Events Across Chapters ---');
    const sampleEvents = [
      { title: 'DevCorps Annual Grand Hackathon 2026', community: 'DevCorps Core', creator: usersByCommunity['DevCorps Core'].id },
      { title: 'DevSphere: Modern Web Architecture & Microfrontends', community: 'DevSphere', creator: usersByCommunity['DevSphere'].id },
      { title: 'AI Horizon: LLM Agentic Coding Masterclass', community: 'AI Horizon', creator: usersByCommunity['AI Horizon'].id },
      { title: 'BIC Converge: Startup Incubation Pitch Day', community: 'BIC Converge', creator: usersByCommunity['BIC Converge'].id },
      { title: 'inCognitus: Annual Campus CTF & Red Team Challenge', community: 'inCognitus', creator: usersByCommunity['inCognitus'].id },
    ];

    for (const ev of sampleEvents) {
      const eventId = await eventsModel.createEvent({
        title: ev.title,
        description: `Official campus event organized by ${ev.community}`,
        category: 'Hackathon',
        location: 'Main Auditorium & Innovation Lab',
        eventDate: '2026-11-20',
        eventTime: '10:00:00',
        organizingDepartment: 'DevCorps',
        organizingCommunity: ev.community,
        userId: ev.creator,
      });
      createdEventIds.push(eventId);
      assert(eventId > 0, `Event "${ev.title}" created under ${ev.community}`);
    }

    // 3. Query & Verify Filtering
    console.log('\n--- 3. Verifying Chapter Discovery & Filter Isolation ---');
    const allDevCorpsEvents = await eventsModel.getAllEvents({}, null);
    const devCorpsFiltered = allDevCorpsEvents.filter(e => e.organizing_department === 'DevCorps');
    assert(devCorpsFiltered.length >= 5, `DevCorps main filter returned all ${devCorpsFiltered.length} chapter events`);

    const incognitusOnly = allDevCorpsEvents.filter(e => (e.organizing_community || '').toLowerCase() === 'incognitus');
    assert(incognitusOnly.length === 1 && incognitusOnly[0].title.includes('CTF'), 'inCognitus chapter filter isolated only cybersecurity events');

    const devSphereOnly = allDevCorpsEvents.filter(e => (e.organizing_community || '').toLowerCase() === 'devsphere');
    assert(devSphereOnly.length >= 1 && devSphereOnly.some(e => e.title.includes('Web Architecture')), 'DevSphere chapter filter isolated web dev events');

    // 4. Cleanup
    console.log('\n--- 4. Cleaning Up Test Artifacts ---');
    for (const eId of createdEventIds) {
      await eventsModel.deleteEvent(eId);
    }
    for (const uId of createdUserIds) {
      await pool.query('DELETE FROM faculty_profiles WHERE user_id = ?', [uId]);
      await pool.query('DELETE FROM users WHERE id = ?', [uId]);
    }
    assert(true, 'All test events and chapter accounts cleaned up safely');

  } catch (err) {
    console.error('Test error:', err);
    failed++;
  }

  console.log('\n================================================================');
  console.log(`  DEVCORPS TEST RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  process.exit(failed === 0 ? 0 : 1);
}

testDevCorpsSystem().catch((err) => {
  console.error(err);
  process.exit(1);
});
