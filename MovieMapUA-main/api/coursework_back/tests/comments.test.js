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

// ─── POST /api/comments ───────────────────────────────────────────────────────

describe('POST /api/comments', () => {
  test('creates a comment for a valid user and movie', async () => {
    const { user } = await createUser();
    const movie = await createMovie(user._id);

    const res = await request(app)
      .post('/api/comments')
      .send({ user: user._id.toString(), movie: movie._id.toString(), text: 'Чудовий фільм!' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.comment.text).toBe('Чудовий фільм!');
  });

  test('returns 404 when user does not exist', async () => {
    const { user } = await createUser();
    const movie = await createMovie(user._id);
    const fakeUserId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .post('/api/comments')
      .send({ user: fakeUserId.toString(), movie: movie._id.toString(), text: 'Ghost comment' });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test('returns 404 when movie does not exist', async () => {
    const { user } = await createUser();
    const fakeMovieId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .post('/api/comments')
      .send({ user: user._id.toString(), movie: fakeMovieId.toString(), text: 'Orphan comment' });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

// ─── GET /api/comments/:movieId ───────────────────────────────────────────────

describe('GET /api/comments/:movieId', () => {
  test('returns all comments for a movie', async () => {
    const { user } = await createUser();
    const movie = await createMovie(user._id);

    await request(app).post('/api/comments')
      .send({ user: user._id.toString(), movie: movie._id.toString(), text: 'First comment' });
    await request(app).post('/api/comments')
      .send({ user: user._id.toString(), movie: movie._id.toString(), text: 'Second comment' });

    const res = await request(app).get(`/api/comments/${movie._id}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.comments).toHaveLength(2);
    expect(res.body.comments[0]).toHaveProperty('user');
  });

  test('returns 404 when movie does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/api/comments/${fakeId}`);
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});