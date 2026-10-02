import express from 'express';
import {
  getTeams,
  createTeam,
  updateTeam,
  deleteTeam,
} from '../controllers/teamController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/rbacMiddleware.js';
import { validateRequest } from '../middleware/validationMiddleware.js';
import { ROLES } from '../constants/roles.js';
import { createTeamSchema, updateTeamSchema } from '../validators/teamValidators.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', requireRole(ROLES.ADMIN, ROLES.SALES_MANAGER), getTeams);
router.post(
  '/',
  requireRole(ROLES.ADMIN, ROLES.SALES_MANAGER),
  validateRequest(createTeamSchema),
  createTeam
);
router.patch(
  '/:id',
  requireRole(ROLES.ADMIN, ROLES.SALES_MANAGER),
  validateRequest(updateTeamSchema),
  updateTeam
);
router.delete('/:id', requireRole(ROLES.ADMIN), deleteTeam);

export default router;
