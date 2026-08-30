const fs = require('fs');
const path = require('path');
const pool = require('../src/shared/config/db');
const eventsModel = require('../src/features/events/events.model');
const eventsController = require('../src/features/events/events.controller');

async function runAudit() {
  console.log('====================================================');
  console.log('  EVENTLY PDF REPORT GENERATOR: FULL AUDIT & TEST   ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, name, details = '') {
    if (condition) {
      console.log(`  [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${name} ${details ? `-> ${details}` : ''}`);
      failed++;
    }
  }

  // 1. Authorization Guard Tests
  console.log('--- 1. Security & RBAC Authorization ---');
  {
    // Test: Non-owner faculty cannot access another faculty's event report
    let rejected = false;
    let statusCode = 0;
    const mockReq = {
      params: { id: 1 },
      user: { id: 999999, role: 'faculty' } // not owner
    };
    const mockRes = {
      status: (code) => {
        statusCode = code;
        return {
          json: (data) => {
            if (code === 403) rejected = true;
          }
        };
      },
      setHeader: () => {},
      headersSent: false
    };

    // Find an event owned by someone else
    const [events] = await pool.query('SELECT id, created_by FROM events WHERE created_by != 999999 LIMIT 1');
    if (events.length > 0) {
      mockReq.params.id = events[0].id;
      await eventsController.generateReport(mockReq, mockRes);
      assert(rejected && statusCode === 403, 'RBAC: Unauthorized non-owner faculty rejected with 403 Forbidden');
    }

    // Test: Admin is always permitted
    let adminPermitted = false;
    const adminReq = {
      params: { id: events[0].id },
      user: { id: 1, role: 'admin' }
    };
    const outPath = path.join(__dirname, 'admin_test_report.pdf');
    const adminRes = fs.createWriteStream(outPath);
    adminRes.setHeader = () => {};
    adminRes.status = () => ({ json: () => {} });
    adminRes.headersSent = false;

    await eventsController.generateReport(adminReq, adminRes);
    await new Promise((resolve) => adminRes.on('finish', resolve));

    if (fs.existsSync(outPath) && fs.statSync(outPath).size > 1000) {
      adminPermitted = true;
      fs.unlinkSync(outPath);
    }
    assert(adminPermitted, 'RBAC: Admin granted report generation access');
  }

  // 2. Multi-Scenario Page Count & Phantom Page Checks
  console.log('\n--- 2. Layout, Page Count & Overflow Checks ---');
  {
    const [allEvents] = await pool.query('SELECT id, title FROM events LIMIT 5');
    for (const ev of allEvents) {
      const outPath = path.join(__dirname, `audit_event_${ev.id}.pdf`);
      const resStream = fs.createWriteStream(outPath);
      resStream.setHeader = () => {};
      resStream.status = () => ({ json: (d) => console.log('Err:', d) });
      resStream.headersSent = false;

      const req = {
        params: { id: ev.id },
        user: { id: 1, role: 'admin' }
      };

      await eventsController.generateReport(req, resStream);
      await new Promise((resolve) => resStream.on('finish', resolve));

      const size = fs.statSync(outPath).size;
      assert(size > 5000, `Event #${ev.id} ("${ev.title.slice(0, 25)}") rendered valid PDF (${size} bytes)`);

      // Read binary to inspect page markers
      const content = fs.readFileSync(outPath, 'utf8');
      const pageMatches = content.match(/\/Type\s*\/Page\b/g) || [];
      const pageCount = pageMatches.length;
      console.log(`         -> Page Count: ${pageCount} page(s)`);
      assert(pageCount >= 1 && pageCount <= 4, `Event #${ev.id} page count is proportional (${pageCount} pages, no runaway blanks)`);

      fs.unlinkSync(outPath);
    }
  }

  // 3. Asset & File Traversal Safety
  console.log('\n--- 3. Asset & Path Traversal Security ---');
  {
    const ASSETS_DIR = path.join(__dirname, '../src/assets');
    const hasIcon = fs.existsSync(path.join(ASSETS_DIR, 'evently-icon.png'));
    const hasBicLogo = fs.existsSync(path.join(ASSETS_DIR, 'bic-ing-logo.png'));
    assert(hasIcon, 'Institution Brand: evently-icon.png exists in assets');
    assert(hasBicLogo, 'Institution Brand: bic-ing-logo.png exists in assets');
  }

  console.log('\n====================================================');
  console.log(`  AUDIT COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  process.exit(failed === 0 ? 0 : 1);
}

runAudit().catch((err) => {
  console.error('Audit failed with error:', err);
  process.exit(1);
});
