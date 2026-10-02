import { Router } from 'express';
import { exportData } from '../controllers/exportController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.use(requireAuth);

router.get('/:entity', exportData);

export const exportRoutes = router;
