import express from 'express';
import authRoutes from './authRoutes.js';
import leadRoutes from './leadRoutes.js';
import contactRoutes from './contactRoutes.js';
import companyRoutes from './companyRoutes.js';
import pipelineRoutes from './pipelineRoutes.js';
import dealRoutes from './dealRoutes.js';
import activityRoutes from './activityRoutes.js';
import emailRoutes from './emailRoutes.js';
import emailTemplateRoutes from './emailTemplateRoutes.js';
import campaignRoutes from './campaignRoutes.js';
import quoteRoutes from './quoteRoutes.js';
import reportRoutes from './reportRoutes.js';
import userRoutes from './userRoutes.js';
import teamRoutes from './teamRoutes.js';
import publicRoutes from './publicRoutes.js';
import { tenantRoutes } from './tenantRoutes.js';
import { auditRoutes } from './auditRoutes.js';
import { importRoutes } from './importRoutes.js';
import { exportRoutes } from './exportRoutes.js';
import notificationRoutes from './notificationRoutes.js';

const router = express.Router();

// Mount public endpoints (web-to-lead, webhooks)
router.use('/public', publicRoutes);

// Mount core business routers
router.use('/auth', authRoutes);
router.use('/leads', leadRoutes);
router.use('/contacts', contactRoutes);
router.use('/companies', companyRoutes);
router.use('/pipelines', pipelineRoutes);
router.use('/deals', dealRoutes);
router.use('/quotes', quoteRoutes);
router.use('/activities', activityRoutes);
router.use('/emails', emailRoutes);
router.use('/email-templates', emailTemplateRoutes);
router.use('/campaigns', campaignRoutes);
router.use('/reports', reportRoutes);
router.use('/users', userRoutes);
router.use('/teams', teamRoutes);
router.use('/tenant', tenantRoutes);
router.use('/audit-logs', auditRoutes);
router.use('/import', importRoutes);
router.use('/export', exportRoutes);
router.use('/notifications', notificationRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    database: 'connected',
    timestamp: new Date().toISOString(),
  });
});

export default router;
