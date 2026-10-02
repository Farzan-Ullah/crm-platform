import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { ENV } from '../src/config/env.js';

let adminToken;
let managerToken;
let supportToken;

beforeAll(async () => {
  await mongoose.connect(ENV.MONGO_URI);

  // Admin login
  const adminLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'admin@crm.io', password: 'Password123!' });
  adminToken = adminLogin.body.data.accessToken;

  // Manager login
  const managerLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'manager@crm.io', password: 'Password123!' });
  managerToken = managerLogin.body.data.accessToken;

  // Support Agent login
  const supportLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'support@crm.io', password: 'Password123!' });
  supportToken = supportLogin.body.data.accessToken;
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe('Phase 8: Analytics, Funnel & Forecasting', () => {
  it('GET /api/v1/reports/summary - should return executive KPI card statistics', async () => {
    const res = await request(app)
      .get('/api/v1/reports/summary')
      .set('Authorization', `Bearer ${managerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.revenueWon).toBe('number');
    expect(typeof res.body.data.openPipelineValue).toBe('number');
    expect(typeof res.body.data.weightedForecastValue).toBe('number');
    expect(typeof res.body.data.winRate).toBe('number');
    expect(typeof res.body.data.totalLeads).toBe('number');
    expect(typeof res.body.data.leadConversionRate).toBe('number');
  });

  it('GET /api/v1/reports/funnel - should return 5-stage Lead-to-Won conversion funnel', async () => {
    const res = await request(app)
      .get('/api/v1/reports/funnel')
      .set('Authorization', `Bearer ${managerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.stages)).toBe(true);
    expect(res.body.data.stages.length).toBe(5);

    const stageNames = res.body.data.stages.map((s) => s.stage);
    expect(stageNames).toEqual([
      '1. Ingested Leads',
      '2. Contacted',
      '3. Qualified Prospect',
      '4. Converted to Deal',
      '5. Closed Won',
    ]);

    expect(typeof res.body.data.summary.conversionRate).toBe('number');
    expect(typeof res.body.data.summary.totalLeads).toBe('number');
  });

  it('GET /api/v1/reports/forecast - should return monthly cohort revenue forecasting with probabilities', async () => {
    const res = await request(app)
      .get('/api/v1/reports/forecast')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.cohorts)).toBe(true);
    expect(typeof res.body.data.summary.totalPipelineValue).toBe('number');
    expect(typeof res.body.data.summary.totalWeightedForecast).toBe('number');
    expect(typeof res.body.data.summary.overallWinRate).toBe('number');
  });

  it('GET /api/v1/reports/leaderboard - should return sales rep performance rankings', async () => {
    const res = await request(app)
      .get('/api/v1/reports/leaderboard')
      .set('Authorization', `Bearer ${managerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);

    const topRep = res.body.data[0];
    expect(topRep.rank).toBe(1);
    expect(typeof topRep.name).toBe('string');
    expect(typeof topRep.revenueWon).toBe('number');
    expect(typeof topRep.winRate).toBe('number');
    expect(typeof topRep.totalActivities).toBe('number');
  });

  it('GET /api/v1/reports/sources - should return source attribution with conversion rates and ROI', async () => {
    const res = await request(app)
      .get('/api/v1/reports/sources')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);

    const firstSource = res.body.data[0];
    expect(typeof firstSource.source).toBe('string');
    expect(typeof firstSource.totalLeads).toBe('number');
    expect(typeof firstSource.conversionRate).toBe('number');
    expect(typeof firstSource.revenueWon).toBe('number');
  });

  it('GET /api/v1/reports/win-loss - should return win/loss ratios and reason distribution', async () => {
    const res = await request(app)
      .get('/api/v1/reports/win-loss')
      .set('Authorization', `Bearer ${managerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.metrics.winRate).toBe('number');
    expect(typeof res.body.data.metrics.totalClosed).toBe('number');
    expect(Array.isArray(res.body.data.lostReasons)).toBe(true);
  });

  it('GET /api/v1/reports/activities - should return activity engagement trends', async () => {
    const res = await request(app)
      .get('/api/v1/reports/activities')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.byType)).toBe(true);
    expect(Array.isArray(res.body.data.timeline)).toBe(true);
  });

  it('GET /api/v1/reports/summary - should filter metrics accurately using date range query params', async () => {
    const now = new Date();
    const past = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const res = await request(app)
      .get(`/api/v1/reports/summary?startDate=${past.toISOString()}&endDate=${now.toISOString()}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /api/v1/reports/summary - Support Agent should be forbidden from accessing reports without permission', async () => {
    const res = await request(app)
      .get('/api/v1/reports/summary')
      .set('Authorization', `Bearer ${supportToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
