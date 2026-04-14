const request = require('supertest');
const mongoose = require('mongoose');
const app = require('./testApp');
const { connectDB, clearCollections, createUser, authCookie } = require('./helpers');

beforeAll(async () => {
  await connectDB();
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

beforeEach(async () => {
  await clearCollections();
});

// ─── Registration ────────────────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  test('registers a new user and returns the user doc', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'alice', email: 'alice@example.com', password: 'secret123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.email).toBe('alice@example.com');
    expect(res.body.username).toBe('alice');
    // The API returns the hashed password in the doc — verify it is hashed, not plain-text
    expect(res.body.password).not.toBe('secret123');
  });

  test('returns 422 when email is already taken', async () => {
    await createUser({ username: 'bob', email: 'bob@example.com' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'bob2', email: 'bob@example.com', password: 'secret123' });

    expect(res.status).toBe(422);
  });

  test('returns 422 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'incomplete' }); // no email or password

    expect(res.status).toBe(422);
  });
});

// ─── Login ───────────────────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  test('logs in with valid credentials and sets cookie', async () => {
    await createUser({ username: 'carol', email: 'carol@example.com' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'carol@example.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.email).toBe('carol@example.com');
    expect(res.headers['set-cookie']).toBeDefined();
    expect(res.headers['set-cookie'][0]).toMatch(/token=/);
  });

  test('returns 400 on wrong password', async () => {
    await createUser({ username: 'dave', email: 'dave@example.com' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'dave@example.com', password: 'wrongpass' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('returns 404 when user does not exist', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'password123' });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});

// ─── Logout ──────────────────────────────────────────────────────────────────

describe('POST /api/auth/logout', () => {
  test('clears the token cookie', async () => {
    const res = await request(app).post('/api/auth/logout');

    expect(res.status).toBe(200);
    const cookie = res.headers['set-cookie']?.[0] ?? '';
    expect(cookie).toMatch(/token=/);
    // The cookie value should be empty (cleared)
    expect(cookie).toMatch(/token=;|token=(?=;)/);
  });
});

// ─── Profile ─────────────────────────────────────────────────────────────────

describe('GET /api/profile', () => {
  test('returns user data when a valid token cookie is present', async () => {
    const { user, token } = await createUser({ username: 'eve', email: 'eve@example.com' });

    const res = await request(app)
      .get('/api/profile')
      .set('Cookie', authCookie(token));

    expect(res.status).toBe(200);
    expect(res.body._id).toBe(user._id.toString());
    expect(res.body.email).toBe('eve@example.com');
  });

  test('returns null when no token is present', async () => {
    const res = await request(app).get('/api/profile');

    expect(res.status).toBe(200);
    expect(res.body).toBeNull();
  });
});