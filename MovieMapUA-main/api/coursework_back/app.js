require('./instrument');
const Sentry = require('@sentry/node');

const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require("mongoose");
const User = require('./models/User')
const authRoute = require('./routes/auth')
const movieRoute = require('./routes/movie')
const locationRoute = require('./routes/location')
const userRoute = require('./routes/users')
const commentRoute = require('./routes/comment')
const contactRoute = require('./controllers/contact')
const cookieParser = require('cookie-parser')
const {verify} = require("jsonwebtoken");
const bodyParser = require('body-parser');
const suggestionsRoute = require('./routes/suggestions');
const favoriteRoutes = require('./routes/favorite');
const healthRoute = require('./routes/health');



const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();
app.use(express.json());
app.use(cookieParser())
app.use(bodyParser.json());
// app.use(cors({
//     credentials: true,
//     origin: true
//     //origin: 'http://localhost:3000'
// }));

const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://darynaa7-gilsgangteamproject1.vercel.app',
];

app.use(cors({
    credentials: true,
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
}));


app.use("/api/auth", authRoute);
app.use("/api/movie", movieRoute);
app.use("/api/location", locationRoute);
app.use("/api/user", userRoute);
app.use('/api/comments', commentRoute);
app.use('/api/contact', contactRoute);
app.use('/api/suggestions', suggestionsRoute);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/health', healthRoute);


const connect = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("Connected to mongoDB.");
    } catch (error) {
        throw error;
    }
};

const PORT = process.env.PORT || 5000;
app.set('port', PORT);

app.get('/test', (req, res) => {
    res.json('test ok');
});


app.get('/api/profile', (req,res) => {
    const {token} = req.cookies;
    if (token) {
        verify(token, process.env.JWT, {}, async (err, userData) => {
            if (err) throw err;
            const user = await User.findById(userData.id).select('username email _id favorites');
            if (!user) return res.json(null);
            res.json(user);
        });
    } else {
        res.json(null);
    }
});


app.post('/api/logout', (req,res) => {
    res.cookie('token', '').json(true);
});

if (process.env.SENTRY_DSN) {
    Sentry.setupExpressErrorHandler(app);
}

app.listen(PORT, () => {
    connect();
    console.log(`Server is running on port ${PORT}`);
});


module.exports = app;

