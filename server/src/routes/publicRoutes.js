import express from 'express';
import { capturePublicLead } from '../controllers/publicLeadController.js';
import { publicLeadLimiter } from '../middleware/rateLimiterMiddleware.js';
import { validateRequest } from '../middleware/validationMiddleware.js';
import { publicLeadCaptureSchema } from '../validators/leadValidators.js';

const router = express.Router();

// Public Web-To-Lead Endpoint (Strict rate limit + Honeypot + Zod validation)
router.post('/leads', publicLeadLimiter, validateRequest(publicLeadCaptureSchema), capturePublicLead);

export default router;
