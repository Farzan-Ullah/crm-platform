import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { ENV } from '../src/config/env.js';

beforeAll(async () => {
  await mongoose.connect(ENV.MONGO_URI);
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe('Phase 1: Authentication & Health API Tests', () => {
  it('GET /health - should return 200 and ok status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('POST /api/v1/auth/login - should fail with invalid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@crm.io',
        password: 'WrongPassword!',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.errorCode).toBe('UNAUTHORIZED');
  });

  it('POST /api/v1/auth/login - should succeed with valid credentials and return cookies', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@crm.io',
        password: 'Password123!',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('admin@crm.io');
    expect(res.body.data.user.role).toBe('ADMIN');
    expect(res.body.data.accessToken).toBeDefined();

    // Check Set-Cookie headers
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const hasAccessToken = cookies.some((c) => c.includes('accessToken='));
    const hasRefreshToken = cookies.some((c) => c.includes('refreshToken='));
    expect(hasAccessToken).toBe(true);
    expect(hasRefreshToken).toBe(true);
  });

  it('GET /api/v1/auth/me - should authenticate with Bearer token', async () => {
    // 1. Login
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'manager@crm.io',
        password: 'Password123!',
      });

    const token = loginRes.body.data.accessToken;

    // 2. Fetch me
    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.success).toBe(true);
    expect(meRes.body.data.user.email).toBe('manager@crm.io');
    expect(meRes.body.data.user.role).toBe('SALES_MANAGER');
  });

  it('POST /api/v1/auth/refresh - should rotate session and return fresh tokens', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'rep1@crm.io',
        password: 'Password123!',
      });

    const cookies = loginRes.headers['set-cookie'];
    const refreshCookie = cookies.find((c) => c.startsWith('refreshToken='));

    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', [refreshCookie]);

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.success).toBe(true);
    expect(refreshRes.body.data.accessToken).toBeDefined();
  });
});
