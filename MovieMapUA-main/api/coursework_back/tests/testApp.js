/**
 * Isolated Express app for testing — no app.listen(), no mongoose.connect().
 * Mongoose must be connected externally (done in each test file's beforeAll).
 */
const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const cors = require('cors');
const { verify } = require('jsonwebtoken');
const User = require('../models/User');

const authRoute = require('../routes/auth');
const movieRoute = require('../routes/movie');
const locationRoute = require('../routes/location');
const userRoute = require('../routes/users');
const commentRoute = require('../routes/comment');
const favoriteRoutes = require('../routes/favorite');

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(cors({ credentials: true, origin: 'http://localhost:3000' }));

app.use('/api/auth', authRoute);
app.use('/api/movie', movieRoute);
app.use('/api/location', locationRoute);
app.use('/api/user', userRoute);
app.use('/api/comments', commentRoute);
app.use('/api/favorites', favoriteRoutes);

app.get('/test', (req, res) => {
  res.json('test ok');
});

app.get('/api/profile', (req, res) => {
  const { token } = req.cookies;
  if (token) {
    verify(token, process.env.JWT, {}, async (err, userData) => {
      if (err) return res.status(401).json({ message: 'Invalid token' });
      const user = await User.findById(userData.id).select('username email _id favorites');
      if (!user) return res.json(null);
      res.json(user);
    });
  } else {
    res.json(null);
  }
});

app.post('/api/logout', (req, res) => {
  res.cookie('token', '').json(true);
});

module.exports = app;