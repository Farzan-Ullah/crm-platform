import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { ENV } from '../src/config/env.js';

let adminToken;
let managerToken;
let repToken;
let testDealId;
let normalQuoteId;
let highDiscountQuoteId;

beforeAll(async () => {
  await mongoose.connect(ENV.MONGO_URI);

  // 1. Admin login
  const adminLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'admin@crm.io', password: 'Password123!' });
  adminToken = adminLogin.body.data.accessToken;

  // 2. Manager login
  const managerLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'manager@crm.io', password: 'Password123!' });
  managerToken = managerLogin.body.data.accessToken;

  // 3. Sales rep login
  const repLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'rep1@crm.io', password: 'Password123!' });
  repToken = repLogin.body.data.accessToken;

  // 4. Fetch or create a deal to link
  const dealsRes = await request(app)
    .get('/api/v1/deals?limit=1')
    .set('Authorization', `Bearer ${adminToken}`);

  if (dealsRes.body.data?.deals?.length > 0) {
    testDealId = dealsRes.body.data.deals[0]._id;
  }
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe('Phase 7: Quotations, Approvals & PDF Streaming', () => {
  const unique = Date.now();

  it('POST /api/v1/quotes - should create standard quotation with calculated line items and totals', async () => {
    const res = await request(app)
      .post('/api/v1/quotes')
      .set('Authorization', `Bearer ${repToken}`)
      .send({
        title: `Enterprise Cloud Suite ${unique}`,
        dealId: testDealId,
        lineItems: [
          {
            name: 'Cloud Server Instance',
            description: '16 vCPU, 64GB RAM High Performance',
            unitPrice: 500,
            quantity: 2,
            discountPercent: 5,
            taxPercent: 10,
          },
          {
            name: 'Dedicated Support Package',
            description: '24/7 SLA Response',
            unitPrice: 200,
            quantity: 1,
            discountPercent: 0,
            taxPercent: 10,
          },
        ],
        terms: 'Net 30 payment terms.',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.quoteNumber).toMatch(/^QT-\d{4}-\d+/);
    expect(res.body.data.status).toBe('Draft');
    expect(res.body.data.subtotal).toBe(1200); // (500*2) + (200*1)
    expect(res.body.data.totalDiscount).toBe(50); // 5% of 1000 = 50
    expect(res.body.data.approvalDetails.requiresApproval).toBe(false);

    normalQuoteId = res.body.data._id;
  });

  it('POST /api/v1/quotes - should auto-detect discount > 15% and flag for manager approval', async () => {
    const res = await request(app)
      .post('/api/v1/quotes')
      .set('Authorization', `Bearer ${repToken}`)
      .send({
        title: `High Discount Promo Quote ${unique}`,
        dealId: testDealId,
        lineItems: [
          {
            name: 'Enterprise License',
            description: 'End-of-quarter promotional discount',
            unitPrice: 10000,
            quantity: 1,
            discountPercent: 25, // 25% > 15% threshold!
            taxPercent: 10,
          },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('Pending Approval');
    expect(res.body.data.approvalDetails.requiresApproval).toBe(true);
    expect(res.body.data.approvalDetails.approvalReason).toContain('exceeds');

    highDiscountQuoteId = res.body.data._id;
  });

  it('POST /api/v1/quotes/:id/approve - Sales Executive should be forbidden from approving high discount quote', async () => {
    const res = await request(app)
      .post(`/api/v1/quotes/${highDiscountQuoteId}/approve`)
      .set('Authorization', `Bearer ${repToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/quotes/:id/approve - Sales Manager should approve high-discount quote successfully', async () => {
    const res = await request(app)
      .post(`/api/v1/quotes/${highDiscountQuoteId}/approve`)
      .set('Authorization', `Bearer ${managerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('Approved');
    expect(res.body.data.approvalDetails.approvedBy).toBeTruthy();
    expect(res.body.data.approvalDetails.approvedAt).toBeTruthy();
  });

  it('POST /api/v1/quotes/:id/reject - Sales Manager should reject quotation with reason', async () => {
    // Create another quote to reject
    const createRes = await request(app)
      .post('/api/v1/quotes')
      .set('Authorization', `Bearer ${repToken}`)
      .send({
        title: `Excessive Discount Request ${unique}`,
        lineItems: [
          {
            name: 'Consulting Hours',
            unitPrice: 200,
            quantity: 50,
            discountPercent: 40,
            taxPercent: 5,
          },
        ],
      });

    const rejectQuoteId = createRes.body.data._id;

    const res = await request(app)
      .post(`/api/v1/quotes/${rejectQuoteId}/reject`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ reason: 'Margin too low, maximum discount allowed is 20%.' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('Rejected');
    expect(res.body.data.approvalDetails.rejectionReason).toBe('Margin too low, maximum discount allowed is 20%.');
  });

  it('POST /api/v1/quotes/:id/send - should record quote as sent to client', async () => {
    const res = await request(app)
      .post(`/api/v1/quotes/${highDiscountQuoteId}/send`)
      .set('Authorization', `Bearer ${repToken}`)
      .send({
        to: 'client@vought.com',
        subject: 'Your Approved Custom Proposal',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('Sent');
    expect(res.body.data.sentAt).toBeTruthy();
  });

  it('POST /api/v1/quotes/:id/accept - should mark quote accepted and optionally update deal value', async () => {
    const res = await request(app)
      .post(`/api/v1/quotes/${highDiscountQuoteId}/accept`)
      .set('Authorization', `Bearer ${repToken}`)
      .send({ syncDeal: true });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('Accepted');
    expect(res.body.data.acceptedAt).toBeTruthy();

    if (testDealId) {
      const dealRes = await request(app)
        .get(`/api/v1/deals/${testDealId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(dealRes.body.data.value).toBe(res.body.data.grandTotal);
    }
  });

  it('GET /api/v1/quotes/stats - should return quotation pipeline metrics', async () => {
    const res = await request(app)
      .get('/api/v1/quotes/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalQuotes).toBeGreaterThanOrEqual(2);
    expect(res.body.data.totalQuotedAmount).toBeGreaterThan(0);
    expect(typeof res.body.data.acceptedCount).toBe('number');
  });

  it('GET /api/v1/quotes/:id/pdf - should stream PDF document with valid application/pdf MIME type', async () => {
    const res = await request(app)
      .get(`/api/v1/quotes/${normalQuoteId}/pdf`)
      .set('Authorization', `Bearer ${adminToken}`)
      .buffer(true)
      .parse((res, callback) => {
        res.setEncoding('binary');
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          callback(null, Buffer.from(data, 'binary'));
        });
      });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('application/pdf');
    expect(res.headers['content-disposition']).toContain('inline;');

    // PDF Magic bytes: %PDF-
    const header = res.body.slice(0, 5).toString('ascii');
    expect(header).toBe('%PDF-');
    expect(res.body.length).toBeGreaterThan(500);
  });

  it('DELETE /api/v1/quotes/:id - should delete quote by Admin', async () => {
    const res = await request(app)
      .delete(`/api/v1/quotes/${normalQuoteId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const getRes = await request(app)
      .get(`/api/v1/quotes/${normalQuoteId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(getRes.status).toBe(404);
  });
});
