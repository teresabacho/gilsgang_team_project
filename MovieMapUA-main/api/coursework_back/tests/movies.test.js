const request = require('supertest');
const mongoose = require('mongoose');
const app = require('./testApp');
const { connectDB, clearCollections, createUser, createMovie, authCookie } = require('./helpers');

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

// ─── GET all movies ───────────────────────────────────────────────────────────

describe('GET /api/movie', () => {
  test('returns an empty array when no movies exist', async () => {
    const res = await request(app).get('/api/movie');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(0);
  });

  test('returns all movies', async () => {
    const { user } = await createUser();
    await createMovie(user._id, { title: 'Film A' });
    await createMovie(user._id, { title: 'Film B' });

    const res = await request(app).get('/api/movie');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });
});

// ─── GET movie by ID ──────────────────────────────────────────────────────────

describe('GET /api/movie/:id', () => {
  test('returns a movie by valid ID', async () => {
    const { user } = await createUser();
    const movie = await createMovie(user._id, { title: 'Specific Film' });

    const res = await request(app).get(`/api/movie/${movie._id}`);
    expect(res.status).toBe(200);
    expect(res.body.movie.title).toBe('Specific Film');
  });

  test('returns 404 for non-existent ID', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/api/movie/${fakeId}`);
    expect(res.status).toBe(404);
  });
});

// ─── GET /api/movie/page (pagination) ────────────────────────────────────────

describe('GET /api/movie/page', () => {
  test('returns paginated movies with totalPages', async () => {
    const { user } = await createUser();
    for (let i = 0; i < 5; i++) {
      await createMovie(user._id, { title: `Film ${i}` });
    }

    const res = await request(app).get('/api/movie/page?page=1&limit=3');
    expect(res.status).toBe(200);
    expect(res.body.movies).toHaveLength(3);
    expect(res.body.totalPages).toBe(2);
  });

  test('filters by genre', async () => {
    const { user } = await createUser();
    await createMovie(user._id, { title: 'Drama Film', genre: 'Drama' });
    await createMovie(user._id, { title: 'Comedy Film', genre: 'Comedy' });

    const res = await request(app).get('/api/movie/page?genre=drama');
    expect(res.status).toBe(200);
    expect(res.body.movies).toHaveLength(1);
    expect(res.body.movies[0].title).toBe('Drama Film');
  });

  test('filters by year', async () => {
    const { user } = await createUser();
    await createMovie(user._id, { title: 'Old Film', year: '1990' });
    await createMovie(user._id, { title: 'New Film', year: '2020' });

    const res = await request(app).get('/api/movie/page?year=2020');
    expect(res.status).toBe(200);
    expect(res.body.movies).toHaveLength(1);
    expect(res.body.movies[0].title).toBe('New Film');
  });
});

// ─── GET /api/movie/search ────────────────────────────────────────────────────

describe('GET /api/movie/search', () => {
  test('returns matching movies by title (case-insensitive)', async () => {
    const { user } = await createUser();
    await createMovie(user._id, { title: 'Тіні забутих предків' });
    await createMovie(user._id, { title: 'Вавилон 20' });

    const res = await request(app).get('/api/movie/search?title=тіні');
    expect(res.status).toBe(200);
    expect(res.body.movies).toHaveLength(1);
    expect(res.body.movies[0].title).toBe('Тіні забутих предків');
  });

  test('returns 422 when title param is missing', async () => {
    const res = await request(app).get('/api/movie/search');
    expect(res.status).toBe(422);
  });
});

// ─── POST /api/movie (create) ─────────────────────────────────────────────────

describe('POST /api/movie', () => {
  test('creates a movie when authenticated', async () => {
    const { token } = await createUser();

    const res = await request(app)
      .post('/api/movie')
      .set('Cookie', authCookie(token))
      .send({
        title: 'New Ukrainian Film',
        description: 'A gripping story',
        year: '2023',
        director: 'Vasyl Koval',
        genre: 'Thriller',
        posterUrl: 'https://example.com/poster.jpg',
      });

    expect(res.status).toBe(201);
    expect(res.body.movie.title).toBe('New Ukrainian Film');
  });

  test('returns 401 when not authenticated', async () => {
    const res = await request(app)
      .post('/api/movie')
      .send({ title: 'Unauthorized Film' });

    expect(res.status).toBe(401);
  });
});

// ─── PUT /api/movie/:id (update) ──────────────────────────────────────────────

describe('PUT /api/movie/:id', () => {
  test('updates a movie when authenticated as owner', async () => {
    const { user, token } = await createUser();
    const movie = await createMovie(user._id, { title: 'Original Title' });

    const res = await request(app)
      .put(`/api/movie/${movie._id}`)
      .set('Cookie', authCookie(token))
      .send({ title: 'Updated Title' });

    expect(res.status).toBe(200);
    expect(res.body.movie.title).toBe('Updated Title');
  });

  test('returns 403 when authenticated as a different user', async () => {
    const { user } = await createUser();
    const movie = await createMovie(user._id);

    const { token: otherToken } = await createUser({ username: 'hacker', email: 'hack@example.com' });

    const res = await request(app)
      .put(`/api/movie/${movie._id}`)
      .set('Cookie', authCookie(otherToken))
      .send({ title: 'Stolen Title' });

    expect(res.status).toBe(403);
  });
});

// ─── DELETE /api/movie/:id ────────────────────────────────────────────────────

describe('DELETE /api/movie/:id', () => {
  test('deletes a movie when authenticated as owner', async () => {
    const { user, token } = await createUser();
    const movie = await createMovie(user._id);

    const res = await request(app)
      .delete(`/api/movie/${movie._id}`)
      .set('Cookie', authCookie(token));

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);
  });

  test('returns 401 when not authenticated', async () => {
    const { user } = await createUser();
    const movie = await createMovie(user._id);

    const res = await request(app).delete(`/api/movie/${movie._id}`);
    expect(res.status).toBe(401);
  });
});