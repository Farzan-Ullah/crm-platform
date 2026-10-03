import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { ENV } from '../src/config/env.js';
import { User } from '../src/models/User.js';
import { Session } from '../src/models/Session.js';

let adminToken;
let adminUser;

beforeAll(async () => {
  await mongoose.connect(ENV.MONGO_URI);

  const adminLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'admin@crm.io', password: 'Password123!' });
  adminToken = adminLogin.body.data.accessToken;
  adminUser = adminLogin.body.data.user;
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe('User Profile & Session Security Tests', () => {
  it('PATCH /api/v1/auth/profile - should update user name and phone', async () => {
    const res = await request(app)
      .patch('/api/v1/auth/profile')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        firstName: 'Sarah',
        lastName: 'Connor-Updated',
        phone: '+1 (555) 999-8888',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.lastName).toBe('Connor-Updated');
    expect(res.body.data.user.phone).toBe('+1 (555) 999-8888');

    // Restore name
    await request(app)
      .patch('/api/v1/auth/profile')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ firstName: 'Sarah', lastName: 'Connor' });
  });

  it('GET /api/v1/auth/sessions - should return user active login sessions', async () => {
    const res = await request(app)
      .get('/api/v1/auth/sessions')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.sessions)).toBe(true);
  });

  it('DELETE /api/v1/auth/sessions/:id - should revoke specific session', async () => {
    // Create a dummy secondary session
    const dummySession = await Session.create({
      tenantId: adminUser.tenantId,
      userId: adminUser.id || adminUser._id,
      refreshTokenHash: 'dummy_hash_for_test_123',
      ip: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
      expiresAt: new Date(Date.now() + 86400000),
    });

    const res = await request(app)
      .delete(`/api/v1/auth/sessions/${dummySession._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const check = await Session.findById(dummySession._id);
    expect(check).toBeNull();
  });

  it('DELETE /api/v1/auth/sessions - should revoke all other sessions', async () => {
    const res = await request(app)
      .delete('/api/v1/auth/sessions')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
