import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { ENV } from '../src/config/env.js';

let adminToken;
let repToken;
let sampleLeadId;

beforeAll(async () => {
  await mongoose.connect(ENV.MONGO_URI);

  // Authenticate Admin
  const adminLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'admin@crm.io', password: 'Password123!' });
  adminToken = adminLogin.body.data.accessToken;

  // Authenticate Sales Executive (rep1)
  const repLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'rep1@crm.io', password: 'Password123!' });
  repToken = repLogin.body.data.accessToken;
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe('Phase 2: Leads & Assignment Engine Tests', () => {
  it('GET /api/v1/leads - should list leads with server pagination', async () => {
    const res = await request(app)
      .get('/api/v1/leads?page=1&limit=10')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeLessThanOrEqual(10);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.total).toBeGreaterThanOrEqual(20);

    sampleLeadId = res.body.data[0]._id;
  });

  it('GET /api/v1/leads - should filter leads by status', async () => {
    const res = await request(app)
      .get('/api/v1/leads?status=Qualified')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    res.body.data.forEach((lead) => {
      expect(lead.status).toBe('Qualified');
    });
  });

  it('POST /api/v1/leads - should create lead with automated scoring and auto-assignment', async () => {
    const newLeadData = {
      firstName: 'Elon',
      lastName: 'Musk',
      email: 'elon@xai.com',
      phone: '+1 (512) 555-0100',
      company: 'xAI Corporation',
      jobTitle: 'Chief Executive Officer', // Executive title gives +15 points
      source: 'Website', // Website gives +20 points
      tags: ['high-priority'], // Tag gives +10 points
      notes: 'Interested in enterprise pipeline automation.',
    };

    const res = await request(app)
      .post('/api/v1/leads')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(newLeadData);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.firstName).toBe('Elon');
    expect(res.body.data.ownerId).toBeDefined(); // Round-robin auto assigned
    expect(res.body.data.score).toBeGreaterThanOrEqual(60); // Automated score computed
  });

  it('GET /api/v1/leads/:id - should return lead details with score breakdown', async () => {
    const res = await request(app)
      .get(`/api/v1/leads/${sampleLeadId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toBe(sampleLeadId);
    expect(res.body.data.scoreBreakdown).toBeDefined();
    expect(Array.isArray(res.body.data.scoreBreakdown)).toBe(true);
  });

  it('PATCH /api/v1/leads/:id - should update lead and recalculate score', async () => {
    const res = await request(app)
      .patch(`/api/v1/leads/${sampleLeadId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'Contacted',
        jobTitle: 'Vice President of Operations',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('Contacted');
  });

  it('POST /api/v1/leads/:id/assign - should reassign lead to a specific rep', async () => {
    // Get rep1's user id
    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${repToken}`);
    const repId = meRes.body.data.user._id;

    const res = await request(app)
      .post(`/api/v1/leads/${sampleLeadId}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ownerId: repId });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.ownerId.toString()).toBe(repId.toString());
  });

  it('POST /api/v1/public/leads - should capture web-to-lead without auth', async () => {
    const res = await request(app)
      .post('/api/v1/public/leads')
      .send({
        tenantSubdomain: 'acme',
        firstName: 'Public',
        lastName: 'Inquirer',
        email: 'inquiry@acmetest.org',
        phone: '+1 (555) 999-1234',
        company: 'Public Inquiry Inc.',
        notes: 'Inquiry from public contact form on corporate website.',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.leadId).toBeDefined();
  });

  it('POST /api/v1/public/leads - honeypot should block spam submissions silently', async () => {
    const res = await request(app)
      .post('/api/v1/public/leads')
      .send({
        tenantSubdomain: 'acme',
        firstName: 'Bot',
        lastName: 'Spammer',
        hpField: 'I am a spam bot filling hidden inputs',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // Should not create lead
    expect(res.body.data.leadId).toBeUndefined();
  });

  it('GET /api/v1/users/reps - should return active sales representatives', async () => {
    const res = await request(app)
      .get('/api/v1/users/reps')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(3);
  });
});
