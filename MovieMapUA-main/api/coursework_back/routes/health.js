const express = require('express');
const mongoose = require('mongoose');
const { version } = require('../package.json');

const router = express.Router();

const MONGO_STATES = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
};

router.get('/', (req, res) => {
    const readyState = mongoose.connection.readyState;
    const mongoConnected = readyState === 1;

    const payload = {
        status: mongoConnected ? 'ok' : 'degraded',
        uptime: process.uptime(),
        version,
        timestamp: new Date().toISOString(),
        mongo: {
            state: MONGO_STATES[readyState] || 'unknown',
            readyState,
        },
    };

    res.status(mongoConnected ? 200 : 503).json(payload);
});

module.exports = router;
