const request = require('supertest');
const mongoose = require('mongoose');
const app = require('./testApp');
const { connectDB } = require('./helpers');
const { version } = require('../package.json');

beforeAll(async () => {
  await connectDB();
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('GET /api/health', () => {
  test('returns 200 and ok status when mongo is connected', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.version).toBe(version);
    expect(typeof res.body.uptime).toBe('number');
    expect(res.body.uptime).toBeGreaterThanOrEqual(0);
    expect(res.body.mongo.state).toBe('connected');
    expect(res.body.mongo.readyState).toBe(1);
    expect(res.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  test('returns 503 and degraded status when mongo is disconnected', async () => {
    await mongoose.connection.close();

    const res = await request(app).get('/api/health');

    expect(res.status).toBe(503);
    expect(res.body.status).toBe('degraded');
    expect(res.body.mongo.readyState).not.toBe(1);

    await connectDB();
  });
});
