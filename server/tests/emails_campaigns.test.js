import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { ENV } from '../src/config/env.js';

let adminToken;
let testLeadId;
let testTemplateId;
let testEmailTrackingId;
let testEmailLogId;
let testCampaignId;

beforeAll(async () => {
  await mongoose.connect(ENV.MONGO_URI);

  const adminLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'admin@crm.io', password: 'Password123!' });
  adminToken = adminLogin.body.data.accessToken;

  // Retrieve an existing lead to attach polymorphic emails
  const leadsRes = await request(app)
    .get('/api/v1/leads?limit=1')
    .set('Authorization', `Bearer ${adminToken}`);
  testLeadId = leadsRes.body.data[0]._id;
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe('Phase 6: Emails, Templates, Pixel Tracking & Bulk Campaigns', () => {
  const uniqueSuffix = Date.now();

  it('POST /api/v1/email-templates - should create a reusable email template with variable placeholders', async () => {
    const res = await request(app)
      .post('/api/v1/email-templates')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `Executive Introduction Template ${uniqueSuffix}`,
        subject: 'Exciting Partnership Opportunity for {{company}}',
        category: 'Sales',
        bodyHtml: '<h1>Hi {{firstName}},</h1><p>We noticed your work at {{company}} as {{jobTitle}}.</p><p><a href="https://crmplatform.local/demo">Book a Demo</a></p>',
        bodyText: 'Hi {{firstName}}, check out our platform at https://crmplatform.local/demo',
        variables: ['firstName', 'company', 'jobTitle'],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toContain('Executive Introduction Template');
    expect(res.body.data.category).toBe('Sales');
    expect(res.body.data.variables).toContain('firstName');

    testTemplateId = res.body.data._id;
  });

  it('GET /api/v1/email-templates - should list templates with category and search filter', async () => {
    const res = await request(app)
      .get(`/api/v1/email-templates?category=Sales&search=${uniqueSuffix}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0]._id).toBe(testTemplateId);
  });

  it('POST /api/v1/email-templates/:id/preview - should generate live interpolated preview with sample variables', async () => {
    const res = await request(app)
      .post(`/api/v1/email-templates/${testTemplateId}/preview`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        variables: {
          firstName: 'Jordan',
          company: 'HyperTech Labs',
          jobTitle: 'Head of Engineering',
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.renderedSubject).toBe('Exciting Partnership Opportunity for HyperTech Labs');
    expect(res.body.data.renderedHtml).toContain('Hi Jordan,');
    expect(res.body.data.renderedHtml).toContain('HyperTech Labs as Head of Engineering');
  });

  it('POST /api/v1/emails/send - should send a direct email with tracking pixel injection and link wrapping', async () => {
    const res = await request(app)
      .post('/api/v1/emails/send')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        to: `prospect_${uniqueSuffix}@client.com`,
        subject: 'Custom Introduction for {{company}}',
        bodyHtml: '<p>Hello {{firstName}}, please check our link <a href="https://example.com/pricing">Pricing Page</a></p>',
        bodyText: 'Hello {{firstName}}, check https://example.com/pricing',
        entityType: 'Lead',
        entityId: testLeadId,
        variables: {
          firstName: 'Sarah',
          company: 'Acme Cloud',
        },
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.trackingId).toBeDefined();
    expect(res.body.data.to).toBe(`prospect_${uniqueSuffix}@client.com`);
    expect(res.body.data.status).toBe('Sent');
    // Verify tracking pixel injection
    expect(res.body.data.bodyHtml).toContain('/api/v1/emails/track/open/');
    // Verify click link wrapping
    expect(res.body.data.bodyHtml).toContain('/api/v1/emails/track/click/');

    testEmailTrackingId = res.body.data.trackingId;
    testEmailLogId = res.body.data._id;
  });

  it('GET /api/v1/emails - should list email audit logs with pagination and stats', async () => {
    const res = await request(app)
      .get(`/api/v1/emails?to=prospect_${uniqueSuffix}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.emails)).toBe(true);
    expect(res.body.data.emails.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.stats).toBeDefined();
    expect(res.body.data.stats.totalSent).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/v1/emails/track/open/:trackingId - public endpoint should record open and stream 1x1 GIF', async () => {
    const res = await request(app)
      .get(`/api/v1/emails/track/open/${testEmailTrackingId}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('image/gif');
    expect(res.body).toBeDefined();

    // Verify database state updated
    const logRes = await request(app)
      .get(`/api/v1/emails/${testEmailLogId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(logRes.body.data.status).toBe('Opened');
    expect(logRes.body.data.openCount).toBe(1);
    expect(logRes.body.data.openedAt).toBeDefined();
    expect(logRes.body.data.opens.length).toBe(1);
  });

  it('GET /api/v1/emails/track/click/:trackingId - public endpoint should record click and redirect 302', async () => {
    const targetUrl = 'https://example.com/pricing';
    const res = await request(app)
      .get(`/api/v1/emails/track/click/${testEmailTrackingId}?target=${encodeURIComponent(targetUrl)}`);

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe(targetUrl);

    // Verify database state updated
    const logRes = await request(app)
      .get(`/api/v1/emails/${testEmailLogId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(logRes.body.data.status).toBe('Clicked');
    expect(logRes.body.data.clickCount).toBe(1);
    expect(logRes.body.data.clickedAt).toBeDefined();
    expect(logRes.body.data.clicks.length).toBe(1);
  });

  it('POST /api/v1/campaigns - should create a marketing campaign with target audience criteria', async () => {
    const res = await request(app)
      .post('/api/v1/campaigns')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `Q4 Enterprise Campaign ${uniqueSuffix}`,
        subject: 'Accelerate Cloud Migration in Q4',
        templateId: testTemplateId,
        targetAudience: {
          entityType: 'Lead',
          filters: {
            status: ['New', 'Contacted'],
            scoreMin: 0,
            scoreMax: 100,
          },
        },
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toContain('Q4 Enterprise Campaign');
    expect(res.body.data.status).toBe('Draft');
    expect(res.body.data.templateId).toBe(testTemplateId);

    testCampaignId = res.body.data._id;
  });

  it('POST /api/v1/campaigns/estimate-audience - should estimate recipients matching audience filters', async () => {
    const res = await request(app)
      .post('/api/v1/campaigns/estimate-audience')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        targetAudience: {
          entityType: 'Lead',
          filters: {
            scoreMin: 0,
            scoreMax: 100,
          },
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.entityType).toBe('Lead');
    expect(res.body.data.totalCount).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(res.body.data.samples)).toBe(true);
  });

  it('POST /api/v1/campaigns/:id/launch - should execute bulk campaign and update delivery stats', async () => {
    const res = await request(app)
      .post(`/api/v1/campaigns/${testCampaignId}/launch`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('Sending');
    expect(res.body.data.totalRecipients).toBeGreaterThanOrEqual(1);

    // Wait 500ms for batch execution loop
    await new Promise((resolve) => setTimeout(resolve, 500));

    const campaignCheck = await request(app)
      .get(`/api/v1/campaigns/${testCampaignId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(campaignCheck.body.data.stats.totalRecipients).toBeGreaterThanOrEqual(1);
    expect(campaignCheck.body.data.stats.sentCount).toBeGreaterThanOrEqual(1);
  });
});
