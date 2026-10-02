import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { ENV } from '../src/config/env.js';

let adminToken;
let sampleCompanyId;
let sampleContactId;
let leadToConvertId;

beforeAll(async () => {
  await mongoose.connect(ENV.MONGO_URI);

  const adminLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'admin@crm.io', password: 'Password123!' });
  adminToken = adminLogin.body.data.accessToken;

  // Find an un-converted lead to convert
  const leadsRes = await request(app)
    .get('/api/v1/leads?limit=5')
    .set('Authorization', `Bearer ${adminToken}`);
  const unconverted = leadsRes.body.data.find((l) => !l.isConverted) || leadsRes.body.data[0];
  leadToConvertId = unconverted._id;
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe('Phase 3: Contacts, Companies, Duplicate Detection & Lead Conversion Tests', () => {
  const uniqueSuffix = Date.now();

  it('GET /api/v1/companies - should list companies with contactsCount', async () => {
    const res = await request(app)
      .get('/api/v1/companies')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].contactsCount).toBeDefined();

    sampleCompanyId = res.body.data[0]._id;
  });

  it('POST /api/v1/companies - should create company and enforce unique domain', async () => {
    const domain = `vought-${uniqueSuffix}.com`;

    const res = await request(app)
      .post('/api/v1/companies')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `Vought International ${uniqueSuffix}`,
        domain,
        industry: 'Pharmaceuticals',
        size: '500+',
        website: `https://${domain}`,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.domain).toBe(domain);

    // Duplicate domain test
    const duplicateRes = await request(app)
      .post('/api/v1/companies')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Vought Clone',
        domain,
      });

    expect(duplicateRes.status).toBe(409);
    expect(duplicateRes.body.errorCode).toBe('CONFLICT');
  });

  it('GET /api/v1/contacts - should list contacts with company populated', async () => {
    const res = await request(app)
      .get('/api/v1/contacts')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].companyId).toBeDefined();

    sampleContactId = res.body.data[0]._id;
  });

  it('POST /api/v1/contacts - should create contact and prevent duplicate email', async () => {
    const email = `john-${uniqueSuffix}@vought.com`;

    const res = await request(app)
      .post('/api/v1/contacts')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        firstName: 'Homelander',
        lastName: 'Hero',
        email,
        phone: '+1 (555) 777-8888',
        jobTitle: 'Chief Super',
        companyId: sampleCompanyId,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(email);

    // Duplicate email test
    const dupRes = await request(app)
      .post('/api/v1/contacts')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        firstName: 'Another',
        lastName: 'Person',
        email,
      });

    expect(dupRes.status).toBe(409);
    expect(dupRes.body.errorCode).toBe('CONFLICT');
  });

  it('POST /api/v1/contacts/merge - should merge secondary contact into primary contact', async () => {
    const c1Email = `clark-${uniqueSuffix}@dailyplanet.com`;
    const c2Email = `kal-${uniqueSuffix}@metropolis.gov`;

    // 1. Create two test contacts
    const c1 = await request(app)
      .post('/api/v1/contacts')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        firstName: 'Clark',
        lastName: 'Kent',
        email: c1Email,
        phone: '+1 (212) 555-0991',
        jobTitle: 'Reporter',
      });

    const c2 = await request(app)
      .post('/api/v1/contacts')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        firstName: 'Kal',
        lastName: 'El',
        email: c2Email,
        phone: '+1 (212) 555-0992',
        jobTitle: 'Investigative Journalist',
      });

    const primaryId = c1.body.data._id;
    const secondaryId = c2.body.data._id;

    // 2. Perform merge, choosing specific fields
    const mergeRes = await request(app)
      .post('/api/v1/contacts/merge')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        primaryContactId: primaryId,
        secondaryContactId: secondaryId,
        mergedFields: {
          firstName: 'Clark',
          lastName: 'Kent (Kal-El)',
          email: c1Email,
          phone: '+1 (212) 555-0991',
          jobTitle: 'Senior Investigative Journalist',
        },
      });

    expect(mergeRes.status).toBe(200);
    expect(mergeRes.body.success).toBe(true);
    expect(mergeRes.body.data.lastName).toBe('Kent (Kal-El)');
    expect(mergeRes.body.data.jobTitle).toBe('Senior Investigative Journalist');

    // 3. Verify secondary contact is no longer returned in default contacts listing
    const contactsList = await request(app)
      .get('/api/v1/contacts')
      .set('Authorization', `Bearer ${adminToken}`);

    const hasSecondary = contactsList.body.data.some((c) => c._id === secondaryId);
    expect(hasSecondary).toBe(false);
  });

  it('POST /api/v1/leads/:id/convert - should transactionally convert lead into contact, company & deal', async () => {
    const res = await request(app)
      .post(`/api/v1/leads/${leadToConvertId}/convert`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        companyChoice: 'new',
        newCompanyName: `Converted Corp ${uniqueSuffix}`,
        newCompanyDomain: `converted-${uniqueSuffix}.com`,
        contactChoice: 'new',
        newContactFirstName: 'Conversion',
        newContactLastName: 'Candidate',
        newContactEmail: `candidate-${uniqueSuffix}@converted.com`,
        createDeal: true,
        dealTitle: 'Converted Prospect Corp Enterprise License',
        dealValue: 120000,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.contactId).toBeDefined();
    expect(res.body.data.companyId).toBeDefined();
    expect(res.body.data.dealId).toBeDefined();

    // Verify lead status is Converted
    const leadCheck = await request(app)
      .get(`/api/v1/leads/${leadToConvertId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(leadCheck.body.data.status).toBe('Converted');
    expect(leadCheck.body.data.isConverted).toBe(true);
  });
});
