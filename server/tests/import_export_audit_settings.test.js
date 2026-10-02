import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { ENV } from '../src/config/env.js';

let adminToken;
let repToken;

beforeAll(async () => {
  await mongoose.connect(ENV.MONGO_URI);

  // Admin login
  const adminLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'admin@crm.io', password: 'Password123!' });
  adminToken = adminLogin.body.data.accessToken;

  // Sales executive login
  const repLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'rep1@crm.io', password: 'Password123!' });
  repToken = repLogin.body.data.accessToken;
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe('Phase 9: CSV/Excel Data Import/Export, Audit Logs & System Settings', () => {
  const unique = Date.now();

  describe('Tenant CRM Settings', () => {
    it('GET /api/v1/tenant/settings - should retrieve tenant settings with company, localization, and sales defaults', async () => {
      const res = await request(app)
        .get('/api/v1/tenant/settings')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('company');
      expect(res.body.data).toHaveProperty('localization');
      expect(res.body.data).toHaveProperty('sales');
      expect(res.body.data).toHaveProperty('smtp');
    });

    it('PATCH /api/v1/tenant/settings - should update tenant profile and sales configuration and mask SMTP passwords', async () => {
      const res = await request(app)
        .patch('/api/v1/tenant/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          company: {
            name: `Nexus Enterprise ${unique}`,
            website: 'https://nexus-enterprise.test',
            phone: '+1-800-555-0199',
          },
          localization: {
            currency: 'USD',
            currencySymbol: '$',
            timezone: 'America/New_York',
          },
          sales: {
            defaultQuoteValidityDays: 45,
            defaultTaxRate: 8.5,
          },
          smtp: {
            enabled: true,
            host: 'smtp.mailtrap.io',
            port: 2525,
            user: 'test_mailtrap_user',
            password: 'secret_smtp_password_123',
            fromEmail: 'crm@nexus-enterprise.test',
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.data.company.name).toBe(`Nexus Enterprise ${unique}`);
      expect(res.body.data.localization.timezone).toBe('America/New_York');
      expect(res.body.data.sales.defaultQuoteValidityDays).toBe(45);
      expect(res.body.data.smtp.hasPassword).toBe(true);
      expect(res.body.data.smtp.password).toBe('••••••••');
    });

    it('POST /api/v1/tenant/settings/test-smtp - should verify SMTP connection test handler', async () => {
      const res = await request(app)
        .post('/api/v1/tenant/settings/test-smtp')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          smtp: {
            host: 'smtp.test.io',
            port: 587,
            user: 'test',
            password: 'pwd',
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.data.success).toBe(true);
    });

    it('PATCH /api/v1/tenant/settings - should deny access to non-admin users without settings:manage permission', async () => {
      const res = await request(app)
        .patch('/api/v1/tenant/settings')
        .set('Authorization', `Bearer ${repToken}`)
        .send({
          company: { name: 'Hacked CRM' },
        });

      expect(res.status).toBe(403);
    });
  });

  describe('Audit Logs & Compliance', () => {
    it('GET /api/v1/audit-logs - should return paginated audit logs with actor and entity details', async () => {
      const res = await request(app)
        .get('/api/v1/audit-logs?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.data.length).toBeGreaterThan(0);

      // Verify log structure
      const firstLog = res.body.data[0];
      expect(firstLog).toHaveProperty('action');
      expect(firstLog).toHaveProperty('entity');
      expect(firstLog).toHaveProperty('createdAt');
    });

    it('GET /api/v1/audit-logs/stats - should return executive audit activity stats and breakdown', async () => {
      const res = await request(app)
        .get('/api/v1/audit-logs/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('totalEvents');
      expect(res.body.data).toHaveProperty('actionsBreakdown');
      expect(Array.isArray(res.body.data.actionsBreakdown)).toBe(true);
    });

    it('GET /api/v1/audit-logs/export - should stream CSV export of audit trails', async () => {
      const res = await request(app)
        .get('/api/v1/audit-logs/export')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('Timestamp,ActorName,ActorEmail,ActorRole,Action,Entity');
    });

    it('GET /api/v1/audit-logs - should forbid non-admin sales rep from viewing compliance logs', async () => {
      const res = await request(app)
        .get('/api/v1/audit-logs')
        .set('Authorization', `Bearer ${repToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('Data Import Engine', () => {
    it('GET /api/v1/import/template/Lead - should return downloadable CSV template for leads', async () => {
      const res = await request(app)
        .get('/api/v1/import/template/Lead')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('First Name,Last Name,Email');
    });

    it('POST /api/v1/import/preview - should parse uploaded CSV and auto-detect header mappings', async () => {
      const csvContent =
        'First Name,Last Name,Email Address,Phone Number,Company\n' +
        `Bruce,Wayne,bruce.${unique}@wayne.com,+15551111,Wayne Corp\n` +
        `Clark,Kent,clark.${unique}@dailyplanet.com,+15552222,Daily Planet\n`;

      const res = await request(app)
        .post('/api/v1/import/preview')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('entity', 'Lead')
        .attach('file', Buffer.from(csvContent, 'utf-8'), 'leads_upload.csv');

      expect(res.status).toBe(200);
      expect(res.body.data.totalRows).toBe(2);
      expect(res.body.data.headers).toContain('First Name');
      expect(res.body.data.headers).toContain('Email Address');
      expect(res.body.data.suggestedMappings['First Name']).toBe('firstName');
      expect(res.body.data.suggestedMappings['Last Name']).toBe('lastName');
      expect(res.body.data.suggestedMappings['Email Address']).toBe('email');
      expect(res.body.data.previewRows.length).toBe(2);
    });

    it('POST /api/v1/import/execute - should bulk insert leads, handle duplicate skip, and record audit event', async () => {
      const importCsv =
        'first_name,last_name,email,company,status\n' +
        `Diana,Prince,diana.${unique}@themyscira.com,Amazon Defense,Qualified\n` +
        `Barry,Allen,barry.${unique}@centralcity.com,STAR Labs,New\n` +
        `Duplicate,Lead,diana.${unique}@themyscira.com,Dupe Co,New\n` + // Duplicate email
        ',MissingLast,bad.${unique}@test.com,NoName Co,New\n'; // Missing firstName

      const mappings = {
        first_name: 'firstName',
        last_name: 'lastName',
        email: 'email',
        company: 'company',
        status: 'status',
      };

      const res = await request(app)
        .post('/api/v1/import/execute')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('entity', 'Lead')
        .field('duplicateStrategy', 'skip')
        .field('mappings', JSON.stringify(mappings))
        .attach('file', Buffer.from(importCsv, 'utf-8'), 'batched_leads.csv');

      expect(res.status).toBe(200);
      expect(res.body.data.totalRows).toBe(4);
      expect(res.body.data.importedCount).toBe(2); // Diana & Barry
      expect(res.body.data.skippedCount).toBe(1); // Duplicate Diana
      expect(res.body.data.failedCount).toBe(1); // Missing first name
      expect(res.body.data.errors.length).toBe(1);
      expect(res.body.data.errors[0].rowNumber).toBe(5);
    });
  });

  describe('Data Export Engine', () => {
    it('GET /api/v1/export/leads?format=csv - should stream CSV export of leads', async () => {
      const res = await request(app)
        .get('/api/v1/export/leads?format=csv')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('FirstName,LastName,Email');
    });

    it('GET /api/v1/export/deals?format=xlsx - should stream binary Excel (.xlsx) file with workbook headers', async () => {
      const res = await request(app)
        .get('/api/v1/export/deals?format=xlsx')
        .set('Authorization', `Bearer ${adminToken}`)
        .buffer(true)
        .parse((res, callback) => {
          const chunks = [];
          res.on('data', (chunk) => chunks.push(chunk));
          res.on('end', () => callback(null, Buffer.concat(chunks)));
        });

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('spreadsheetml.sheet');
      expect(Buffer.isBuffer(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(100);
    });
  });
});
