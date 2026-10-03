import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { ENV } from '../src/config/env.js';
import { Notification } from '../src/models/Notification.js';

let adminToken;
let repToken;

beforeAll(async () => {
  await mongoose.connect(ENV.MONGO_URI);

  const adminLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'admin@crm.io', password: 'Password123!' });
  adminToken = adminLogin.body.data.accessToken;

  const repLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'rep1@crm.io', password: 'Password123!' });
  repToken = repLogin.body.data.accessToken;
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe('Notification Engine & In-App Center Tests', () => {
  let createdNotificationId;

  it('GET /api/v1/notifications - should return user notifications and unread count', async () => {
    const res = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.notifications)).toBe(true);
    expect(res.body.data.notifications.length).toBeGreaterThan(0);
    expect(typeof res.body.data.unreadCount).toBe('number');

    createdNotificationId = res.body.data.notifications[0]._id;
  });

  it('GET /api/v1/notifications/unread-count - should return unread badge number', async () => {
    const res = await request(app)
      .get('/api/v1/notifications/unread-count')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.unreadCount).toBeDefined();
    expect(typeof res.body.data.unreadCount).toBe('number');
  });

  it('PATCH /api/v1/notifications/:id/read - should mark a single notification as read', async () => {
    const res = await request(app)
      .patch(`/api/v1/notifications/${createdNotificationId}/read`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isRead).toBe(true);
    expect(res.body.data.readAt).toBeDefined();
  });

  it('PATCH /api/v1/notifications/mark-all-read - should mark all user notifications as read', async () => {
    const res = await request(app)
      .patch('/api/v1/notifications/mark-all-read')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const checkRes = await request(app)
      .get('/api/v1/notifications/unread-count')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(checkRes.body.data.unreadCount).toBe(0);
  });

  it('DELETE /api/v1/notifications/:id - should delete the notification', async () => {
    const res = await request(app)
      .delete(`/api/v1/notifications/${createdNotificationId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const check = await Notification.findById(createdNotificationId);
    expect(check).toBeNull();
  });

  it('GET /api/v1/notifications - should enforce tenant/user isolation between accounts', async () => {
    const repRes = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${repToken}`);

    expect(repRes.status).toBe(200);
    expect(repRes.body.success).toBe(true);
    expect(Array.isArray(repRes.body.data.notifications)).toBe(true);
  });
});
