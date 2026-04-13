const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Movie = require('../models/Movie');

/**
 * Connect mongoose to the in-memory server started in globalSetup.
 * Safe to call multiple times — skips if already connected.
 */
async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI_TEST);
  }
}

/** Drop every collection between tests for isolation. */
async function clearCollections() {
  for (const col of Object.values(mongoose.connection.collections)) {
    await col.deleteMany({});
  }
}

/** Create a user directly in the DB and return the doc + signed token. */
async function createUser(overrides = {}) {
  const defaults = {
    username: 'testuser',
    email: 'test@example.com',
    password: bcrypt.hashSync('password123', 10),
  };
  const user = await User.create({ ...defaults, ...overrides });
  const token = jwt.sign({ email: user.email, id: user._id }, process.env.JWT);
  return { user, token };
}

/** Create a second distinct user (for authorization tests). */
async function createOtherUser() {
  return createUser({ username: 'other', email: 'other@example.com' });
}

/** Create a movie document owned by the given userId. */
async function createMovie(userId, overrides = {}) {
  const defaults = {
    title: 'Test Film',
    description: 'A test film description',
    year: '2020',
    director: 'Test Director',
    genre: 'Drama',
    posterUrl: 'https://example.com/poster.jpg',
    user: userId,
  };
  return Movie.create({ ...defaults, ...overrides });
}

/** Return a cookie header string from a token. */
function authCookie(token) {
  return `token=${token}`;
}

module.exports = { connectDB, clearCollections, createUser, createOtherUser, createMovie, authCookie };