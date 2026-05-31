// ============================================================
//  MoveAll CRM — Automated Test Suite (Phase 2: White Box)
//  Run with:  npm test
// ============================================================

const fetch = require('node-fetch');

const BASE_URL = 'https://evolution-moveallcrm-demo-tvijay.xqnsvk.easypanel.host';

// Tokens stored here after login tests
let adminToken = '';
let staffToken = '';

// ─────────────────────────────────────────────
//  HELPER
// ─────────────────────────────────────────────
async function api(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(BASE_URL + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch (_) {}
  return { status: res.status, body: json };
}

// ─────────────────────────────────────────────
//  1. LOGIN TESTS
// ─────────────────────────────────────────────
describe('1. Login & Authentication', () => {

  test('Admin can log in with correct credentials', async () => {
    const res = await api('POST', '/api/auth/login', {
      email: 'admin@movehome.com',
      password: 'admin123',
    });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('token');
    adminToken = res.body.data.token;
  }, 10000);

  test('Staff can log in with correct credentials', async () => {
    const res = await api('POST', '/api/auth/login', {
      email: 'tvijaytamil1999@gmail.com',
      password: '1234',
    });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('token');
    staffToken = res.body.data.token;
  }, 10000);

  test('Login fails with wrong password', async () => {
    const res = await api('POST', '/api/auth/login', {
      email: 'admin@movehome.com',
      password: 'wrongpassword',
    });
    expect(res.status).toBe(401);
  }, 10000);

  test('Login fails with missing email', async () => {
    const res = await api('POST', '/api/auth/login', {
      password: 'admin123',
    });
    expect([400, 401, 422]).toContain(res.status);
  }, 10000);

  test('Login fails with missing password', async () => {
    const res = await api('POST', '/api/auth/login', {
      email: 'admin@movehome.com',
    });
    expect([400, 401, 422]).toContain(res.status);
  }, 10000);

  test('Login fails with a fake email', async () => {
    const res = await api('POST', '/api/auth/login', {
      email: 'fake@fake.com',
      password: 'fake123',
    });
    expect(res.status).toBe(401);
  }, 10000);

});

// ─────────────────────────────────────────────
//  2. AUTH GUARD TESTS (no token)
// ─────────────────────────────────────────────
describe('2. Auth Guard — blocked without login', () => {

  test('Cannot access leads without a token', async () => {
    const res = await api('GET', '/api/leads');
    expect([401, 403]).toContain(res.status);
  }, 10000);

  test('Cannot access jobs without a token', async () => {
    const res = await api('GET', '/api/jobs');
    expect([401, 403]).toContain(res.status);
  }, 10000);

  test('Cannot access users without a token', async () => {
    const res = await api('GET', '/api/users');
    expect([401, 403]).toContain(res.status);
  }, 10000);

  test('Cannot access contacts without a token', async () => {
    const res = await api('GET', '/api/contacts');
    expect([401, 403]).toContain(res.status);
  }, 10000);

});

// ─────────────────────────────────────────────
//  3. LEADS TESTS
// ─────────────────────────────────────────────
describe('3. Leads', () => {

  test('Admin can fetch all leads', async () => {
    const res = await api('GET', '/api/leads', null, adminToken);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body) || typeof res.body === 'object').toBe(true);
  }, 10000);

  test('Admin can create a new lead', async () => {
    const res = await api('POST', '/api/leads', {
      lead_name: 'Test Lead Auto',
      phone: '0412345678',
      email: 'testlead@auto.com',
      move_date: '2026-08-01',
      move_out_address: '1 Test St, Sydney',
      move_in_address: '2 Test Ave, Melbourne',
      status: 'New to call',
      category: 'Local Move',
      lead_source: 'Manually Added',
    }, adminToken);
    expect([200, 201]).toContain(res.status);
  }, 10000);

  test('Cannot create a lead without required fields', async () => {
    const res = await api('POST', '/api/leads', {
      email: 'incomplete@test.com',
    }, adminToken);
    expect([400, 422, 500]).toContain(res.status);
  }, 10000);

});

// ─────────────────────────────────────────────
//  4. JOBS TESTS
// ─────────────────────────────────────────────
describe('4. Jobs', () => {

  test('Admin can fetch all jobs', async () => {
    const res = await api('GET', '/api/jobs', null, adminToken);
    expect(res.status).toBe(200);
  }, 10000);

  test('Admin can create a new job', async () => {
    const res = await api('POST', '/api/jobs', {
      job_name: 'Auto Test Job',
      date: '2026-08-15',
      move_out_address: '10 Test Rd, Sydney',
      move_in_address: '20 Auto Blvd, Melbourne',
      price_point: '$220ph (2M+T Prem)',
      category: 'Residential',
      brand: 'MoveAll',
      phone: '0411111111',
      first_name: 'Auto',
      status: 'Scheduled',
    }, adminToken);
    expect([200, 201]).toContain(res.status);
  }, 10000);

});

// ─────────────────────────────────────────────
//  5. ROLE PERMISSION TESTS
// ─────────────────────────────────────────────
describe('5. Role permissions — staff vs admin', () => {

  test('Staff cannot access the users list', async () => {
    const res = await api('GET', '/api/users', null, staffToken);
    expect([401, 403]).toContain(res.status);
  }, 10000);

  test('Admin can access the users list', async () => {
    const res = await api('GET', '/api/users', null, adminToken);
    expect(res.status).toBe(200);
  }, 10000);

  test('Staff cannot create a new user', async () => {
    const res = await api('POST', '/api/users', {
      name: 'Hack User',
      email: 'hack@hack.com',
      password: 'hack123',
      role: 'admin',
    }, staffToken);
    expect([401, 403]).toContain(res.status);
  }, 10000);

});

// ─────────────────────────────────────────────
//  6. CONTACTS TESTS
// ─────────────────────────────────────────────
describe('6. Contacts', () => {

  test('Admin can fetch contacts', async () => {
    const res = await api('GET', '/api/contacts', null, adminToken);
    expect(res.status).toBe(200);
  }, 10000);

  test('Admin can add a contact', async () => {
    const res = await api('POST', '/api/contacts', {
      client_name: 'Auto Test Contact',
      first_name: 'Auto',
      last_name: 'Tester',
      email: 'autocontact@test.com',
      contact_category: 'Residential',
    }, adminToken);
    expect([200, 201]).toContain(res.status);
  }, 10000);

});

// ─────────────────────────────────────────────
//  7. SECURITY TESTS
// ─────────────────────────────────────────────
describe('7. Security', () => {

  test('Sending a script tag in a comment does not cause server error', async () => {
    const res = await api('POST', '/api/leads', {
      lead_name: '<script>alert(1)</script>',
      phone: '0400000000',
      email: 'xss@test.com',
      move_date: '2026-09-01',
      move_out_address: 'XSS Test St',
      move_in_address: 'XSS Move In',
      status: 'New to call',
      category: 'Local Move',
      lead_source: 'Manually Added',
    }, adminToken);
    // Server should handle it — not crash with 500
    expect(res.status).not.toBe(500);
  }, 10000);

  test('Using a made-up token is rejected', async () => {
    const res = await api('GET', '/api/leads', null, 'fake.token.value');
    expect([401, 403]).toContain(res.status);
  }, 10000);

  test('Using an expired / tampered token is rejected', async () => {
    const fakeToken = adminToken ? adminToken.slice(0, -5) + 'XXXXX' : 'bad.token';
    const res = await api('GET', '/api/leads', null, fakeToken);
    expect([401, 403]).toContain(res.status);
  }, 10000);

});
