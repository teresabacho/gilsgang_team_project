/**
 * Performance tests — assert that key endpoints respond within defined SLA thresholds.
 *
 * Thresholds (generous to account for CI/cold-start variance):
 *   - Simple health-check / static reads : 200 ms
 *   - DB reads (movie list, search, etc.) : 500 ms
 *   - DB writes (register, login, create) : 700 ms
 */
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('./testApp');
const { connectDB, clearCollections, createUser, createMovie, authCookie } = require('./helpers');

const FAST_SLA = 200;   // ms — pure in-process response
const READ_SLA = 500;   // ms — single DB read
const WRITE_SLA = 700;  // ms — DB write + bcrypt / JWT

/** Helper: returns elapsed time in ms for a supertest request. */
async function timed(reqFn) {
  const start = Date.now();
  const res = await reqFn();
  const elapsed = Date.now() - start;
  return { res, elapsed };
}

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

// ─── Health check ─────────────────────────────────────────────────────────────

test('GET /test responds within FAST_SLA', async () => {
  const { res, elapsed } = await timed(() => request(app).get('/test'));
  expect(res.status).toBe(200);
  expect(elapsed).toBeLessThan(FAST_SLA);
});

// ─── Movie reads ──────────────────────────────────────────────────────────────

test('GET /api/movie responds within READ_SLA', async () => {
  const { res, elapsed } = await timed(() => request(app).get('/api/movie'));
  expect(res.status).toBe(200);
  expect(elapsed).toBeLessThan(READ_SLA);
});

test('GET /api/movie/page responds within READ_SLA', async () => {
  const { user } = await createUser();
  for (let i = 0; i < 5; i++) {
    await createMovie(user._id, { title: `Perf Film ${i}` });
  }

  const { res, elapsed } = await timed(() =>
    request(app).get('/api/movie/page?page=1&limit=5')
  );
  expect(res.status).toBe(200);
  expect(elapsed).toBeLessThan(READ_SLA);
});

test('GET /api/movie/search responds within READ_SLA', async () => {
  const { user } = await createUser();
  await createMovie(user._id, { title: 'Shukaty Film' });

  const { res, elapsed } = await timed(() =>
    request(app).get('/api/movie/search?title=Shukaty')
  );
  expect(res.status).toBe(200);
  expect(elapsed).toBeLessThan(READ_SLA);
});

test('GET /api/movie/:id responds within READ_SLA', async () => {
  const { user } = await createUser();
  const movie = await createMovie(user._id);

  const { res, elapsed } = await timed(() =>
    request(app).get(`/api/movie/${movie._id}`)
  );
  expect(res.status).toBe(200);
  expect(elapsed).toBeLessThan(READ_SLA);
});

// ─── Auth writes ──────────────────────────────────────────────────────────────

test('POST /api/auth/register responds within WRITE_SLA', async () => {
  const { res, elapsed } = await timed(() =>
    request(app)
      .post('/api/auth/register')
      .send({ username: 'perfuser', email: 'perf@example.com', password: 'perf1234' })
  );
  expect(res.status).toBe(200);
  expect(elapsed).toBeLessThan(WRITE_SLA);
});

test('POST /api/auth/login responds within WRITE_SLA', async () => {
  await createUser({ username: 'loginperf', email: 'loginperf@example.com' });

  const { res, elapsed } = await timed(() =>
    request(app)
      .post('/api/auth/login')
      .send({ email: 'loginperf@example.com', password: 'password123' })
  );
  expect(res.status).toBe(200);
  expect(elapsed).toBeLessThan(WRITE_SLA);
});

// ─── Movie write ──────────────────────────────────────────────────────────────

test('POST /api/movie (authenticated) responds within WRITE_SLA', async () => {
  const { token } = await createUser();

  const { res, elapsed } = await timed(() =>
    request(app)
      .post('/api/movie')
      .set('Cookie', authCookie(token))
      .send({
        title: 'Perf Movie',
        description: 'desc',
        year: '2023',
        director: 'Dir',
        genre: 'Drama',
        posterUrl: 'https://example.com/p.jpg',
      })
  );
  expect(res.status).toBe(201);
  expect(elapsed).toBeLessThan(WRITE_SLA);
});

// ─── Location write ───────────────────────────────────────────────────────────

test('POST /api/location responds within WRITE_SLA', async () => {
  const { user } = await createUser();
  const movie = await createMovie(user._id);

  const { res, elapsed } = await timed(() =>
    request(app)
      .post('/api/location')
      .send({ movie: movie._id.toString(), title: 'Perf Location', coordinates: [50.0, 30.0] })
  );
  expect(res.status).toBe(201);
  expect(elapsed).toBeLessThan(WRITE_SLA);
});

// ─── Favorites read ───────────────────────────────────────────────────────────

test('GET /api/user/favorites responds within READ_SLA', async () => {
  const { token } = await createUser();

  const { res, elapsed } = await timed(() =>
    request(app).get('/api/user/favorites').set('Cookie', authCookie(token))
  );
  expect(res.status).toBe(200);
  expect(elapsed).toBeLessThan(READ_SLA);
});