require('dotenv').config();
const Sentry = require('@sentry/node');

if (process.env.SENTRY_DSN) {
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',
        release: require('./package.json').version,
        tracesSampleRate: 0.1,
        ignoreTransactions: ['GET /api/health'],
    });
    console.log(`Sentry initialised (env: ${process.env.NODE_ENV || 'development'})`);
}

module.exports = Sentry;
