import express from 'express';
import {
  getCompanies,
  createCompany,
  getCompany,
  updateCompany,
  deleteCompany,
  checkCompanyDuplicates,
} from '../controllers/companyController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/rbacMiddleware.js';
import { validateRequest } from '../middleware/validationMiddleware.js';
import { PERMISSIONS } from '../constants/roles.js';
import {
  createCompanySchema,
  updateCompanySchema,
} from '../validators/companyValidators.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', requirePermission(PERMISSIONS.COMPANY_READ), getCompanies);
router.post(
  '/',
  requirePermission(PERMISSIONS.COMPANY_CREATE),
  validateRequest(createCompanySchema),
  createCompany
);
router.get('/duplicates', requirePermission(PERMISSIONS.COMPANY_READ), checkCompanyDuplicates);

router.get('/:id', requirePermission(PERMISSIONS.COMPANY_READ), getCompany);
router.patch(
  '/:id',
  requirePermission(PERMISSIONS.COMPANY_UPDATE),
  validateRequest(updateCompanySchema),
  updateCompany
);
router.delete('/:id', requirePermission(PERMISSIONS.COMPANY_DELETE), deleteCompany);

export default router;
