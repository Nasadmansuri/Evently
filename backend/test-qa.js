const http = require('http');

const API_BASE = 'http://localhost:5000/api';

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_BASE}${path}`);
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: `${url.pathname}${url.search}`,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runQA() {
  console.log('\n=============================================');
  console.log('🚀 EVENTLY FULL QA & SECURITY AUDIT SUITE');
  console.log('=============================================\n');

  // TEST 1: Health Check
  console.log('1. Testing System Health...');
  try {
    const res = await request('/health');
    assert(res.status === 200, 'Health endpoint responds with 200 OK');
    assert(res.data.status === 'ok', 'Health status is "ok"');
  } catch (err) {
    assert(false, `Health check failed: ${err.message}`);
  }

  // TEST 2: SQL Injection Defense on Login
  console.log('\n2. Testing SQL Injection Defense on Login...');
  try {
    const sqliRes = await request('/auth/login', {
      method: 'POST',
      body: {
        email: "' OR '1'='1' --",
        password: "password' OR '1'='1",
      },
    });
    assert(sqliRes.status === 400 || sqliRes.status === 401, 'SQL injection attempt blocked with 400/401');
    assert(!sqliRes.data.token, 'No authentication token issued for SQL injection payload');
  } catch (err) {
    assert(false, `SQL injection test error: ${err.message}`);
  }

  // TEST 3: Auth Validation & Invalid Credentials
  console.log('\n3. Testing Auth Validation & Credential Verification...');
  try {
    const invalidLogin = await request('/auth/login', {
      method: 'POST',
      body: {
        email: 'nonexistent_test_user@bic.edu.np',
        password: 'WrongPassword123!',
      },
    });
    assert(invalidLogin.status === 401, 'Nonexistent user rejected with 401 Unauthorized');
  } catch (err) {
    assert(false, `Invalid login test error: ${err.message}`);
  }

  // TEST 4: Protected Routes Without JWT
  console.log('\n4. Testing JWT Auth Guard on Protected Routes...');
  try {
    const unauthMe = await request('/users/me');
    assert(unauthMe.status === 401, 'GET /api/users/me blocked without token (401)');

    const forgedTokenRes = await request('/users/me', {
      headers: { Authorization: 'Bearer forged.fake.jwt.token.signature' },
    });
    assert(forgedTokenRes.status === 401, 'Forged JWT rejected with 401 Unauthorized');
  } catch (err) {
    assert(false, `JWT Auth guard error: ${err.message}`);
  }

  // TEST 5: Public Event Listing & Data Integrity
  console.log('\n5. Testing Public Events Catalog & Query Parameters...');
  try {
    const eventsRes = await request('/events');
    assert(eventsRes.status === 200, 'GET /api/events returns 200 OK');
    assert(Array.isArray(eventsRes.data.events || eventsRes.data), 'Events payload returns an array');

    const eventsList = eventsRes.data.events || eventsRes.data;
    if (eventsList.length > 0) {
      const firstEvent = eventsList[0];
      assert(typeof firstEvent.title === 'string', 'Event has string title');
      assert(typeof firstEvent.event_date === 'string', 'Event has event_date');
      assert(firstEvent.category !== undefined, 'Event has category defined');

      // Test Single Event retrieval
      const singleRes = await request(`/events/${firstEvent.id}`);
      assert(singleRes.status === 200, `GET /api/events/${firstEvent.id} returns 200 OK`);
      assert(singleRes.data.id === firstEvent.id, 'Single event ID matches requested ID');
    }
  } catch (err) {
    assert(false, `Events listing error: ${err.message}`);
  }

  // TEST 6: Category Filter Testing
  console.log('\n6. Testing Category & Keyword Filtering...');
  try {
    const filterRes = await request('/events?category=Workshop');
    assert(filterRes.status === 200, 'GET /api/events?category=Workshop returns 200 OK');
  } catch (err) {
    assert(false, `Category filter test error: ${err.message}`);
  }

  // TEST 7: Role Authorization Guard (Attempt admin action unauthenticated)
  console.log('\n7. Testing Admin Action RBAC Security Guards...');
  try {
    const adminAction = await request('/events', {
      method: 'POST',
      body: { title: 'Hacked Event', category: 'Technical' },
    });
    assert(adminAction.status === 401, 'Unauthorized event creation blocked (401)');
  } catch (err) {
    assert(false, `RBAC security guard test error: ${err.message}`);
  }

  // TEST 8: Feedback System Protection
  console.log('\n8. Testing Feedback System Route Integrity...');
  try {
    const feedbackRes = await request('/feedback/event/999999');
    assert(feedbackRes.status === 200 || feedbackRes.status === 404, 'Feedback endpoint responds gracefully without crashing');
  } catch (err) {
    assert(false, `Feedback route error: ${err.message}`);
  }

  console.log('\n=============================================');
  console.log(`📊 QA AUDIT SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('=============================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runQA();
