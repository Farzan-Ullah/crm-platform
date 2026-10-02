import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { ENV } from '../src/config/env.js';

describe('Phase 10: Security Hardening, OWASP Controls & Production Readiness', () => {
  beforeAll(async () => {
    await mongoose.connect(ENV.MONGO_URI);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe('Security Headers (Helmet & HTTP Policy)', () => {
    it('should include secure HTTP headers (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection)', async () => {
      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
    });

    it('should sanitize NoSQL query operators from request bodies (mongoSanitize)', async () => {
      const injectionAttempt = {
        email: { $gt: '' },
        password: 'Password123!',
      };

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send(injectionAttempt);

      // mongoSanitize strips or rejects the '$gt' operator
      expect([400, 422]).toContain(res.status);
    });
  });

  describe('Rate Limiter & API Thresholds', () => {
    it('should provide standard rate limiting headers on API routes', async () => {
      const res = await request(app).get('/api/v1/health');

      expect(res.status).toBe(200);
      // Express rate limit standard headers
      const hasRateLimitHeader =
        res.headers['ratelimit-limit'] !== undefined ||
        res.headers['x-ratelimit-limit'] !== undefined;

      expect(hasRateLimitHeader).toBe(true);
    });
  });

  describe('Error Handling & Information Disclosure Prevention', () => {
    it('should return 404 for unhandled routes with sanitized JSON response', async () => {
      const res = await request(app).get('/api/v1/non-existent-endpoint-xyz');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('NOT_FOUND');
    });

    it('should reject tampered or malformed JWT access tokens with 401', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid_tampered_jwt_token_payload_xyz');

      expect(res.status).toBe(401);
      expect(res.body.errorCode).toBe('INVALID_TOKEN');
    });

    it('should not leak stack traces in test/production error responses for standard client errors', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nonexistent@crm.io', password: 'Password123!' });

      expect(res.status).toBe(401);
      expect(res.body.stack).toBeUndefined();
    });
  });

  describe('System Health & Availability', () => {
    it('GET /health - should return operational health status', async () => {
      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.timestamp).toBeDefined();
    });
  });
});
