/* eslint-disable no-console */

const BASE_URL = process.env.API_BASE_URL || 'http://127.0.0.1:5000/api';

const request = async (path, { method = 'GET', token, body } = {}) => {
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { _raw: text };
  }

  if (!res.ok) {
    const message = json?.message || `${res.status} ${res.statusText}`;
    const err = new Error(`${method} ${path} -> ${message}`);
    err.status = res.status;
    err.body = json;
    throw err;
  }

  return json;
};

const login = async (email, password) => {
  const data = await request('/auth/login', { method: 'POST', body: { email, password } });
  return data.token;
};

const main = async () => {
  const results = [];
  const record = (label, extra) => results.push({ label, ...extra });

  // Health
  const health = await request('/health');
  record('GET /health', { ok: health?.status === 'OK' });

  // Login seeded admin
  const adminToken = await login('admin@tutorbooking.com', 'password123');
  record('POST /auth/login (admin)', { ok: !!adminToken });

  // Admin creates a tutor + student (since seed is admin-only)
  const tutorUser = await request('/admin/users', {
    method: 'POST',
    token: adminToken,
    body: {
      name: 'Seed Tutor',
      email: `tutor_${Date.now()}@email.com`,
      password: 'password123',
      role: 'tutor',
      contact_no: '0700000000',
      is_approved: true,
      subjects: 'Math',
      location: 'Colombo',
      bio: 'Created by smoke test',
    },
  });
  record('POST /admin/users (tutor)', { ok: !!tutorUser?.id });

  const studentUser = await request('/admin/users', {
    method: 'POST',
    token: adminToken,
    body: {
      name: 'Seed Student',
      email: `student_${Date.now()}@email.com`,
      password: 'password123',
      role: 'student',
      contact_no: '0711111111',
      grade: '10',
    },
  });
  record('POST /admin/users (student)', { ok: !!studentUser?.id });

  const tutorToken = await login(tutorUser.email, 'password123');
  record('POST /auth/login (tutor)', { ok: !!tutorToken });

  const studentToken = await login(studentUser.email, 'password123');
  record('POST /auth/login (student)', { ok: !!studentToken });

  // Tutor: request new class (admin approval required)
  const requested = await request('/tutor/classes', {
    method: 'POST',
    token: tutorToken,
    body: {
      title: `Smoke Test Class ${Date.now()}`,
      subject: 'Mathematics',
      grade: '11',
      schedule: 'Mon 5PM',
      location: 'Colombo',
      price: 1234,
      description: 'Requested by apiSmokeTest',
    },
  });
  record('POST /tutor/classes (request)', { ok: !!requested?.request?.id });

  const approved = await request(`/admin/class-requests/${requested.request.id}/approve`, {
    method: 'POST',
    token: adminToken,
  });
  const created = approved.class;
  record('POST /admin/class-requests/:id/approve', { ok: !!created?.id });

  // Student: list classes + read the created class
  const classesList = await request('/classes');
  record('GET /classes', { ok: Array.isArray(classesList?.classes) });

  const classDetail = await request(`/classes/${created.id}`);
  record('GET /classes/:id', { ok: classDetail?.id === created.id });

  const updated = await request(`/tutor/classes/${created.id}`, {
    method: 'PUT',
    token: tutorToken,
    body: { title: `${created.title} (Updated)`, price: 2000 },
  });
  record('PUT /tutor/classes/:id', { ok: updated?.title?.includes('Updated') });

  const tutorClasses = await request('/tutor/classes', { token: tutorToken });
  record('GET /tutor/classes', { ok: Array.isArray(tutorClasses) });

  // Tutor: promote class (dev mode will allow without real Stripe)
  const promo = await request('/promotions/pay', {
    method: 'POST',
    token: tutorToken,
    body: { class_id: created.id, plan: 'week', payment_method_id: 'pm_test' },
  });
  record('POST /promotions/pay', { ok: !!promo?.promotion?.id });

  const promos = await request('/promotions', { token: tutorToken });
  record('GET /promotions', { ok: Array.isArray(promos) });

  // Student: enroll in newly created class
  const enroll = await request(`/classes/${created.id}/enroll`, { method: 'POST', token: studentToken });
  record('POST /classes/:id/enroll', { ok: !!enroll?.enrollment?.id });

  // Student: review class
  const review = await request(`/classes/${created.id}/review`, {
    method: 'POST',
    token: studentToken,
    body: { rating: 5, comment: 'Great class (smoke test)' },
  });
  record('POST /classes/:id/review', { ok: !!review?.review?.id });

  const reviews = await request(`/classes/${created.id}/reviews`);
  record('GET /classes/:id/reviews', { ok: Array.isArray(reviews) });

  // Tutor: announcement
  const ann = await request(`/tutor/classes/${created.id}/announcement`, {
    method: 'POST',
    token: tutorToken,
    body: { content: 'Hello students (smoke test)' },
  });
  record('POST /tutor/classes/:id/announcement', { ok: !!ann?.id });

  const anns = await request(`/tutor/classes/${created.id}/announcements`, { token: tutorToken });
  record('GET /tutor/classes/:id/announcements', { ok: Array.isArray(anns) });

  // Notifications: tutor should have at least one notification (enrollment)
  const tutorNotifs = await request('/notifications', { token: tutorToken });
  record('GET /notifications', { ok: Array.isArray(tutorNotifs) });

  if (tutorNotifs[0]?.id) {
    const marked = await request(`/notifications/${tutorNotifs[0].id}/read`, { method: 'PUT', token: tutorToken });
    record('PUT /notifications/:id/read', { ok: marked?.read === true });
  } else {
    record('PUT /notifications/:id/read', { ok: false, note: 'No notifications to mark read' });
  }

  await request('/notifications/token', {
    method: 'POST',
    token: tutorToken,
    body: { push_token: 'ExponentPushToken[smoke-test]' },
  });
  record('POST /notifications/token', { ok: true });

  const send = await request('/notifications/send', {
    method: 'POST',
    token: adminToken,
    body: { title: 'Smoke Test', message: 'System broadcast', target: 'all' },
  });
  record('POST /notifications/send', { ok: typeof send?.count === 'number' });

  // Admin: list + update a class
  const adminClasses = await request('/admin/classes', { token: adminToken });
  record('GET /admin/classes', { ok: Array.isArray(adminClasses) });

  const adminUpdate = await request(`/admin/classes/${created.id}`, {
    method: 'PUT',
    token: adminToken,
    body: { price: 2001 },
  });
  record('PUT /admin/classes/:id', { ok: adminUpdate?.id === created.id });

  // Admin: create and delete a class (full CRUD)
  const tutorId = tutorUser.id;

  const adminCreated = await request('/admin/classes', {
    method: 'POST',
    token: adminToken,
    body: {
      tutor_id: tutorId,
      title: `Admin Created Class ${Date.now()}`,
      subject: 'Science',
      grade: '10',
      schedule: 'Tue 3PM',
      location: 'Kandy',
      price: 999,
      description: 'Created by admin smoke test',
    },
  });
  record('POST /admin/classes', { ok: !!adminCreated?.id });

  await request(`/admin/classes/${adminCreated.id}`, { method: 'DELETE', token: adminToken });
  record('DELETE /admin/classes/:id', { ok: true });

  // Tutor: delete the test class (cleanup)
  await request(`/tutor/classes/${created.id}`, { method: 'DELETE', token: tutorToken });
  record('DELETE /tutor/classes/:id', { ok: true });

  // Admin: delete created users
  await request(`/admin/users/${studentUser.id}`, { method: 'DELETE', token: adminToken });
  record('DELETE /admin/users/:id (student)', { ok: true });
  await request(`/admin/users/${tutorUser.id}`, { method: 'DELETE', token: adminToken });
  record('DELETE /admin/users/:id (tutor)', { ok: true });

  console.log(`\nAPI smoke test against ${BASE_URL}`);
  for (const r of results) {
    const status = r.ok ? '✅' : '❌';
    const note = r.note ? ` (${r.note})` : '';
    console.log(`${status} ${r.label}${note}`);
  }

  const failed = results.filter((r) => !r.ok);
  if (failed.length) {
    process.exitCode = 1;
  }
};

main().catch((err) => {
  console.error('\n❌ Smoke test failed:', err.message);
  if (err.body) console.error('Response:', err.body);
  process.exitCode = 1;
});
