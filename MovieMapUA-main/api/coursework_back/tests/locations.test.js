const request = require('supertest');
const mongoose = require('mongoose');
const app = require('./testApp');
const { connectDB, clearCollections, createUser, createMovie } = require('./helpers');

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

// ─── POST /api/location ───────────────────────────────────────────────────────

describe('POST /api/location', () => {
  test('creates a location for an existing movie', async () => {
    const { user } = await createUser();
    const movie = await createMovie(user._id);

    const res = await request(app)
      .post('/api/location')
      .send({
        movie: movie._id.toString(),
        title: 'Kyiv City Center',
        coordinates: [50.4501, 30.5234],
      });

    expect(res.status).toBe(201);
    expect(res.body.location.title).toBe('Kyiv City Center');
    expect(res.body.location.coordinates).toEqual([50.4501, 30.5234]);
  });

  test('returns 404 when movie does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .post('/api/location')
      .send({
        movie: fakeId.toString(),
        title: 'Nowhere',
        coordinates: [0, 0],
      });

    expect(res.status).toBe(404);
  });
});

// ─── GET /api/location/:id ────────────────────────────────────────────────────

describe('GET /api/location/:id', () => {
  test('returns a location by valid ID', async () => {
    const { user } = await createUser();
    const movie = await createMovie(user._id);

    const createRes = await request(app)
      .post('/api/location')
      .send({ movie: movie._id.toString(), title: 'Lviv Old Town', coordinates: [49.8397, 24.0297] });

    const locationId = createRes.body.location._id;

    const res = await request(app).get(`/api/location/${locationId}`);
    expect(res.status).toBe(200);
    expect(res.body.location.title).toBe('Lviv Old Town');
  });

  test('returns 404 for a non-existent location ID', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/api/location/${fakeId}`);
    expect(res.status).toBe(404);
  });
});

// ─── GET /api/location/movie/:movieId ─────────────────────────────────────────

describe('GET /api/location/movie/:movieId', () => {
  test('returns all locations for a movie', async () => {
    const { user } = await createUser();
    const movie = await createMovie(user._id);

    await request(app).post('/api/location')
      .send({ movie: movie._id.toString(), title: 'Location 1', coordinates: [50.0, 30.0] });
    await request(app).post('/api/location')
      .send({ movie: movie._id.toString(), title: 'Location 2', coordinates: [50.1, 30.1] });

    const res = await request(app).get(`/api/location/movie/${movie._id}`);
    expect(res.status).toBe(200);
    expect(res.body.locations).toHaveLength(2);
  });

  test('returns 404 when movie does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/api/location/movie/${fakeId}`);
    expect(res.status).toBe(404);
  });
});

// ─── PUT /api/location/:id ────────────────────────────────────────────────────

describe('PUT /api/location/:id', () => {
  test('updates a location title and coordinates', async () => {
    const { user } = await createUser();
    const movie = await createMovie(user._id);

    const createRes = await request(app)
      .post('/api/location')
      .send({ movie: movie._id.toString(), title: 'Old Title', coordinates: [50.0, 30.0] });

    const locationId = createRes.body.location._id;

    const res = await request(app)
      .put(`/api/location/${locationId}`)
      .send({ title: 'New Title', coordinates: [51.0, 31.0] });

    expect(res.status).toBe(200);
    expect(res.body.location.title).toBe('New Title');
    expect(res.body.location.coordinates).toEqual([51.0, 31.0]);
  });
});

// ─── DELETE /api/location/:id ─────────────────────────────────────────────────

describe('DELETE /api/location/:id', () => {
  test('deletes a location and removes it from the movie', async () => {
    const { user } = await createUser();
    const movie = await createMovie(user._id);

    const createRes = await request(app)
      .post('/api/location')
      .send({ movie: movie._id.toString(), title: 'Temp Location', coordinates: [50.0, 30.0] });

    const locationId = createRes.body.location._id;

    const res = await request(app).delete(`/api/location/${locationId}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);

    // Confirm it no longer exists
    const getRes = await request(app).get(`/api/location/${locationId}`);
    expect(getRes.status).toBe(404);
  });
});