import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { ENV } from '../src/config/env.js';

let adminToken;
let defaultPipeline;
let testDealId;
let wonStageId;
let lostStageId;

beforeAll(async () => {
  await mongoose.connect(ENV.MONGO_URI);

  const adminLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'admin@crm.io', password: 'Password123!' });
  adminToken = adminLogin.body.data.accessToken;
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe('Phase 4: Pipelines, Deals, Drag-and-Drop Kanban Board & Revenue Forecast', () => {
  const uniqueSuffix = Date.now();

  it('GET /api/v1/pipelines - should retrieve or auto-seed standard pipeline with stages', async () => {
    const res = await request(app)
      .get('/api/v1/pipelines')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);

    defaultPipeline = res.body.data.find((p) => p.isDefault) || res.body.data[0];
    expect(defaultPipeline.stages.length).toBeGreaterThanOrEqual(4);

    const wonStage = defaultPipeline.stages.find((s) => s.isWon);
    const lostStage = defaultPipeline.stages.find((s) => s.isLost);
    wonStageId = wonStage?._id;
    lostStageId = lostStage?._id;
  });

  it('POST /api/v1/pipelines - should create custom sales pipeline', async () => {
    const res = await request(app)
      .post('/api/v1/pipelines')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `Enterprise Tech Sales ${uniqueSuffix}`,
        stages: [
          { name: 'Initial Contact', order: 0, probability: 10, color: '#3b82f6' },
          { name: 'Technical POC', order: 1, probability: 40, color: '#6366f1' },
          { name: 'Contract Review', order: 2, probability: 80, color: '#f59e0b' },
          { name: 'Closed Won', order: 3, probability: 100, color: '#10b981', isWon: true },
          { name: 'Closed Lost', order: 4, probability: 0, color: '#ef4444', isLost: true },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe(`Enterprise Tech Sales ${uniqueSuffix}`);
    expect(res.body.data.stages.length).toBe(5);
  });

  it('POST /api/v1/deals - should create new commercial deal with stage probability', async () => {
    const firstStage = defaultPipeline.stages[0];

    const res = await request(app)
      .post('/api/v1/deals')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: `Cloud Infrastructure Migration ${uniqueSuffix}`,
        value: 75000,
        pipelineId: defaultPipeline._id,
        stageId: firstStage._id,
        priority: 'High',
        source: 'Inbound Web',
        expectedClose: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['enterprise', 'cloud', 'aws'],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe(`Cloud Infrastructure Migration ${uniqueSuffix}`);
    expect(res.body.data.value).toBe(75000);
    expect(res.body.data.status).toBe('Open');
    expect(res.body.data.probability).toBe(firstStage.probability);

    testDealId = res.body.data._id;
  });

  it('GET /api/v1/deals - should list deals with pagination and search', async () => {
    const res = await request(app)
      .get(`/api/v1/deals?search=${encodeURIComponent(uniqueSuffix)}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.pagination.total).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/v1/deals/kanban - should return grouped stages with column sum metrics', async () => {
    const res = await request(app)
      .get(`/api/v1/deals/kanban?pipelineId=${defaultPipeline._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.stages).toBeDefined();
    expect(Array.isArray(res.body.data.stages)).toBe(true);
    expect(res.body.data.totalPipelineValue).toBeGreaterThan(0);

    const firstColumn = res.body.data.stages[0];
    expect(firstColumn.deals.length).toBeGreaterThanOrEqual(1);
    expect(firstColumn.totalValue).toBeGreaterThan(0);
  });

  it('PATCH /api/v1/deals/:id/stage - should drag-and-drop move deal to Closed Won and set probability to 100', async () => {
    expect(wonStageId).toBeDefined();

    const res = await request(app)
      .patch(`/api/v1/deals/${testDealId}/stage`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        stageId: wonStageId,
        order: 0,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('Won');
    expect(res.body.data.probability).toBe(100);
  });

  it('PATCH /api/v1/deals/:id/stage - should drag-and-drop move deal to Closed Lost and record lostReason', async () => {
    expect(lostStageId).toBeDefined();

    const res = await request(app)
      .patch(`/api/v1/deals/${testDealId}/stage`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        stageId: lostStageId,
        order: 0,
        lostReason: 'Budget cuts by CFO',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('Lost');
    expect(res.body.data.probability).toBe(0);
    expect(res.body.data.lostReason).toBe('Budget cuts by CFO');
  });

  it('GET /api/v1/deals/forecast - should calculate weighted forecast and stage breakdown', async () => {
    const res = await request(app)
      .get(`/api/v1/deals/forecast?pipelineId=${defaultPipeline._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.metrics).toBeDefined();
    expect(res.body.data.metrics.winRate).toBeDefined();
    expect(Array.isArray(res.body.data.stageBreakdown)).toBe(true);
    expect(Array.isArray(res.body.data.monthlyBreakdown)).toBe(true);
  });

  it('DELETE /api/v1/deals/:id - should delete deal', async () => {
    const res = await request(app)
      .delete(`/api/v1/deals/${testDealId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
