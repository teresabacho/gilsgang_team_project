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

// ─── GET /api/user/added ──────────────────────────────────────────────────────

describe('GET /api/user/added', () => {
  test('returns movies added by the authenticated user', async () => {
    const { user, token } = await createUser();

    // Add a movie via the API so it is pushed onto user.addedMovies
    await request(app)
      .post('/api/movie')
      .set('Cookie', authCookie(token))
      .send({
        title: 'My Film',
        description: 'desc',
        year: '2022',
        director: 'Dir',
        genre: 'Drama',
        posterUrl: 'https://example.com/p.jpg',
      });

    const res = await request(app)
      .get('/api/user/added')
      .set('Cookie', authCookie(token));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].title).toBe('My Film');
  });

  test('returns 401 when not authenticated', async () => {
    const res = await request(app).get('/api/user/added');
    expect(res.status).toBe(401);
  });
});

// ─── Favorites CRUD ───────────────────────────────────────────────────────────

describe('POST /api/user/favorites', () => {
  test('adds a movie to favorites', async () => {
    const { user, token } = await createUser();
    const movie = await createMovie(user._id);

    const res = await request(app)
      .post('/api/user/favorites')
      .set('Cookie', authCookie(token))
      .send({ type: 'movie', movieId: movie._id.toString(), name: movie.title });

    expect(res.status).toBe(201);
    expect(res.body.favorite.type).toBe('movie');
  });

  test('returns 400 when adding the same movie twice', async () => {
    const { user, token } = await createUser();
    const movie = await createMovie(user._id);

    await request(app)
      .post('/api/user/favorites')
      .set('Cookie', authCookie(token))
      .send({ type: 'movie', movieId: movie._id.toString(), name: movie.title });

    const res = await request(app)
      .post('/api/user/favorites')
      .set('Cookie', authCookie(token))
      .send({ type: 'movie', movieId: movie._id.toString(), name: movie.title });

    expect(res.status).toBe(400);
  });

  test('returns 400 for an invalid favorite type', async () => {
    const { token } = await createUser();

    const res = await request(app)
      .post('/api/user/favorites')
      .set('Cookie', authCookie(token))
      .send({ type: 'invalid-type', name: 'Something' });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/user/favorites', () => {
  test('returns favorites grouped by type', async () => {
    const { user, token } = await createUser();
    const movie = await createMovie(user._id);

    await request(app)
      .post('/api/user/favorites')
      .set('Cookie', authCookie(token))
      .send({ type: 'movie', movieId: movie._id.toString(), name: movie.title });

    const res = await request(app)
      .get('/api/user/favorites')
      .set('Cookie', authCookie(token));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('movies');
    expect(res.body).toHaveProperty('hotels');
    expect(res.body.movies).toHaveLength(1);
  });
});

describe('DELETE /api/user/favorites/:favoriteId', () => {
  test('removes a favorite item', async () => {
    const { user, token } = await createUser();
    const movie = await createMovie(user._id);

    // Add the favourite
    await request(app)
      .post('/api/user/favorites')
      .set('Cookie', authCookie(token))
      .send({ type: 'movie', movieId: movie._id.toString(), name: movie.title });

    // Fetch favourites to get the Mongoose-assigned subdoc _id
    const listRes = await request(app)
      .get('/api/user/favorites')
      .set('Cookie', authCookie(token));
    const favoriteId = listRes.body.movies[0].favoriteId;

    const delRes = await request(app)
      .delete(`/api/user/favorites/${favoriteId}`)
      .set('Cookie', authCookie(token));

    expect(delRes.status).toBe(200);

    // Confirm it's gone
    const checkRes = await request(app)
      .get('/api/user/favorites')
      .set('Cookie', authCookie(token));
    expect(checkRes.body.movies).toHaveLength(0);
  });

  test('returns 404 when favorite does not exist', async () => {
    const { token } = await createUser();
    const fakeId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .delete(`/api/user/favorites/${fakeId}`)
      .set('Cookie', authCookie(token));

    expect(res.status).toBe(404);
  });
});

describe('GET /api/user/favorites/type/:type', () => {
  test('returns only favorites of the requested type', async () => {
    const { user, token } = await createUser();
    const movie = await createMovie(user._id);

    await request(app)
      .post('/api/user/favorites')
      .set('Cookie', authCookie(token))
      .send({ type: 'movie', movieId: movie._id.toString(), name: movie.title });

    await request(app)
      .post('/api/user/favorites')
      .set('Cookie', authCookie(token))
      .send({ type: 'hotel', externalId: 'hotel-123', name: 'Grand Hotel' });

    const res = await request(app)
      .get('/api/user/favorites/type/hotel')
      .set('Cookie', authCookie(token));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].type).toBe('hotel');
  });
});

// ─── Favorite Groups ──────────────────────────────────────────────────────────

describe('Favorite Groups', () => {
  test('POST /api/user/favorite-groups creates a group from existing favorites', async () => {
    const { user, token } = await createUser();
    const movie = await createMovie(user._id);

    // Add favourite and then fetch to get the Mongoose subdoc _id
    await request(app)
      .post('/api/user/favorites')
      .set('Cookie', authCookie(token))
      .send({ type: 'movie', movieId: movie._id.toString(), name: movie.title });

    const listRes = await request(app)
      .get('/api/user/favorites')
      .set('Cookie', authCookie(token));
    const favId = listRes.body.movies[0].favoriteId;

    const res = await request(app)
      .post('/api/user/favorite-groups')
      .set('Cookie', authCookie(token))
      .send({ name: 'My Group', itemIds: [favId] });

    expect(res.status).toBe(201);
    expect(res.body.group.name).toBe('My Group');
  });

  test('POST /api/user/favorite-groups returns 400 when name or items missing', async () => {
    const { token } = await createUser();

    const res = await request(app)
      .post('/api/user/favorite-groups')
      .set('Cookie', authCookie(token))
      .send({ name: 'Empty Group', itemIds: [] });

    expect(res.status).toBe(400);
  });

  test('GET /api/user/favorite-groups returns all groups', async () => {
    const { user, token } = await createUser();
    const movie = await createMovie(user._id);

    await request(app)
      .post('/api/user/favorites')
      .set('Cookie', authCookie(token))
      .send({ type: 'movie', movieId: movie._id.toString(), name: movie.title });

    const listRes = await request(app)
      .get('/api/user/favorites')
      .set('Cookie', authCookie(token));
    const favId = listRes.body.movies[0].favoriteId;

    await request(app)
      .post('/api/user/favorite-groups')
      .set('Cookie', authCookie(token))
      .send({ name: 'Group A', itemIds: [favId] });

    const res = await request(app)
      .get('/api/user/favorite-groups')
      .set('Cookie', authCookie(token));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].name).toBe('Group A');
  });

  test('DELETE /api/user/favorite-groups/:groupId removes the group', async () => {
    const { user, token } = await createUser();
    const movie = await createMovie(user._id);

    await request(app)
      .post('/api/user/favorites')
      .set('Cookie', authCookie(token))
      .send({ type: 'movie', movieId: movie._id.toString(), name: movie.title });

    const listRes = await request(app)
      .get('/api/user/favorites')
      .set('Cookie', authCookie(token));
    const favId = listRes.body.movies[0].favoriteId;

    await request(app)
      .post('/api/user/favorite-groups')
      .set('Cookie', authCookie(token))
      .send({ name: 'To Delete', itemIds: [favId] });

    // Fetch groups to get the real Mongoose subdoc _id
    const groupsRes = await request(app)
      .get('/api/user/favorite-groups')
      .set('Cookie', authCookie(token));
    const groupId = groupsRes.body[0]._id;

    const res = await request(app)
      .delete(`/api/user/favorite-groups/${groupId}`)
      .set('Cookie', authCookie(token));

    expect(res.status).toBe(200);
  });

  test('PUT /api/user/favorite-groups/:groupId renames the group', async () => {
    const { user, token } = await createUser();
    const movie = await createMovie(user._id);

    await request(app)
      .post('/api/user/favorites')
      .set('Cookie', authCookie(token))
      .send({ type: 'movie', movieId: movie._id.toString(), name: movie.title });

    const listRes = await request(app)
      .get('/api/user/favorites')
      .set('Cookie', authCookie(token));
    const favId = listRes.body.movies[0].favoriteId;

    await request(app)
      .post('/api/user/favorite-groups')
      .set('Cookie', authCookie(token))
      .send({ name: 'Original Name', itemIds: [favId] });

    const groupsRes = await request(app)
      .get('/api/user/favorite-groups')
      .set('Cookie', authCookie(token));
    const groupId = groupsRes.body[0]._id;

    const res = await request(app)
      .put(`/api/user/favorite-groups/${groupId}`)
      .set('Cookie', authCookie(token))
      .send({ name: 'Renamed Group' });

    expect(res.status).toBe(200);
    expect(res.body.group.name).toBe('Renamed Group');
  });
});