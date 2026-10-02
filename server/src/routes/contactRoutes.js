import express from 'express';
import {
  getContacts,
  createContact,
  getContact,
  updateContact,
  deleteContact,
  mergeContacts,
  checkContactDuplicates,
} from '../controllers/contactController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/rbacMiddleware.js';
import { validateRequest } from '../middleware/validationMiddleware.js';
import { PERMISSIONS } from '../constants/roles.js';
import {
  createContactSchema,
  updateContactSchema,
  mergeContactsSchema,
} from '../validators/contactValidators.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', requirePermission(PERMISSIONS.CONTACT_READ), getContacts);
router.post(
  '/',
  requirePermission(PERMISSIONS.CONTACT_CREATE),
  validateRequest(createContactSchema),
  createContact
);
router.get('/duplicates', requirePermission(PERMISSIONS.CONTACT_READ), checkContactDuplicates);
router.post(
  '/merge',
  requirePermission(PERMISSIONS.CONTACT_UPDATE),
  validateRequest(mergeContactsSchema),
  mergeContacts
);

router.get('/:id', requirePermission(PERMISSIONS.CONTACT_READ), getContact);
router.patch(
  '/:id',
  requirePermission(PERMISSIONS.CONTACT_UPDATE),
  validateRequest(updateContactSchema),
  updateContact
);
router.delete('/:id', requirePermission(PERMISSIONS.CONTACT_DELETE), deleteContact);

export default router;
