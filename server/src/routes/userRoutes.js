import express from 'express';
import {
  getUsers,
  createUser,
  updateUser,
  getSalesReps,
} from '../controllers/userController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { requireRole, requirePermission } from '../middleware/rbacMiddleware.js';
import { validateRequest } from '../middleware/validationMiddleware.js';
import { ROLES, PERMISSIONS } from '../constants/roles.js';
import { createUserSchema, updateUserSchema } from '../validators/userValidators.js';

const router = express.Router();

router.use(requireAuth);

router.get('/reps', getSalesReps);

router.get('/', requirePermission(PERMISSIONS.USER_READ), getUsers);
router.post(
  '/',
  requireRole(ROLES.ADMIN, ROLES.SALES_MANAGER),
  validateRequest(createUserSchema),
  createUser
);
router.patch(
  '/:id',
  requireRole(ROLES.ADMIN, ROLES.SALES_MANAGER),
  validateRequest(updateUserSchema),
  updateUser
);

export default router;
