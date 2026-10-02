import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { ENV } from '../src/config/env.js';

let adminToken;
let testLeadId;
let testTaskId;
let testCallId;
let testMeetingId;

beforeAll(async () => {
  await mongoose.connect(ENV.MONGO_URI);

  const adminLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'admin@crm.io', password: 'Password123!' });
  adminToken = adminLogin.body.data.accessToken;

  // Retrieve an existing lead to attach polymorphic activities
  const leadsRes = await request(app)
    .get('/api/v1/leads?limit=1')
    .set('Authorization', `Bearer ${adminToken}`);
  testLeadId = leadsRes.body.data[0]._id;
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe('Phase 5: Activities, Tasks, Meetings, Call Logs & Reminders', () => {
  const uniqueSuffix = Date.now();

  it('POST /api/v1/activities - should create a Task with reminder and polymorphic Lead association', async () => {
    const res = await request(app)
      .post('/api/v1/activities')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        type: 'Task',
        title: `Prepare executive migration quote ${uniqueSuffix}`,
        description: 'Review SLA terms and finalize line item discount.',
        priority: 'High',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        entityType: 'Lead',
        entityId: testLeadId,
        reminderEnabled: true,
        reminderOffsetMinutes: 30,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.type).toBe('Task');
    expect(res.body.data.priority).toBe('High');
    expect(res.body.data.entityType).toBe('Lead');
    expect(res.body.data.leadId).toBe(testLeadId);
    expect(res.body.data.reminderEnabled).toBe(true);

    testTaskId = res.body.data._id;
  });

  it('POST /api/v1/activities - should create a Call Log with call outcome and duration', async () => {
    const res = await request(app)
      .post('/api/v1/activities')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        type: 'Call',
        title: `Introductory Discovery Call ${uniqueSuffix}`,
        description: 'Discussed cloud migration timelines and multi-region failover.',
        callOutcome: 'Connected',
        callDirection: 'Outbound',
        phoneNumber: '+1 (555) 019-2834',
        duration: 25,
        status: 'Completed',
        entityType: 'Lead',
        entityId: testLeadId,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.type).toBe('Call');
    expect(res.body.data.callOutcome).toBe('Connected');
    expect(res.body.data.duration).toBe(25);
    expect(res.body.data.status).toBe('Completed');

    testCallId = res.body.data._id;
  });

  it('POST /api/v1/activities - should create a Meeting with location and meeting link', async () => {
    const res = await request(app)
      .post('/api/v1/activities')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        type: 'Meeting',
        title: `Architecture Review & Product Demo ${uniqueSuffix}`,
        location: 'Google Meet',
        meetingLink: 'https://meet.google.com/abc-wxyz-123',
        attendees: ['lead@client.com', 'cto@client.com'],
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        duration: 45,
        priority: 'High',
        entityType: 'Lead',
        entityId: testLeadId,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.type).toBe('Meeting');
    expect(res.body.data.location).toBe('Google Meet');
    expect(res.body.data.meetingLink).toBe('https://meet.google.com/abc-wxyz-123');
    expect(res.body.data.attendees.length).toBe(2);

    testMeetingId = res.body.data._id;
  });

  it('GET /api/v1/activities - should list activities with filters, pagination, and KPI counts', async () => {
    const res = await request(app)
      .get('/api/v1/activities?type=Task')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.activities)).toBe(true);
    expect(res.body.data.activities.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.stats).toBeDefined();
    expect(res.body.data.stats.total).toBeGreaterThanOrEqual(1);
    expect(res.body.pagination).toBeDefined();
  });

  it('GET /api/v1/activities/calendar - should return activities in date range for calendar', async () => {
    const start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const res = await request(app)
      .get(`/api/v1/activities/calendar?start=${start}&end=${end}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
  });

  it('GET /api/v1/activities/upcoming - should return upcoming tasks for current user', async () => {
    const res = await request(app)
      .get('/api/v1/activities/upcoming')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/v1/activities/timeline/:entityType/:entityId - should return polymorphic timeline', async () => {
    const res = await request(app)
      .get(`/api/v1/activities/timeline/Lead/${testLeadId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(3);

    const callEvent = res.body.data.find((e) => e.activityType === 'Call');
    expect(callEvent).toBeDefined();
    expect(callEvent.callOutcome).toBe('Connected');
  });

  it('PATCH /api/v1/activities/:id/complete - should toggle task completion', async () => {
    const res = await request(app)
      .patch(`/api/v1/activities/${testTaskId}/complete`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('Completed');
    expect(res.body.data.completedAt).toBeDefined();

    // Toggle back to Pending
    const toggleBack = await request(app)
      .patch(`/api/v1/activities/${testTaskId}/complete`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(toggleBack.status).toBe(200);
    expect(toggleBack.body.data.status).toBe('Pending');
  });

  it('DELETE /api/v1/activities/:id - should delete activity', async () => {
    const res = await request(app)
      .delete(`/api/v1/activities/${testTaskId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
