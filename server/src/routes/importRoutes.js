import { Router } from 'express';
import {
  previewImport,
  runImport,
  downloadTemplate,
  downloadErrorReport,
} from '../controllers/importController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.use(requireAuth);

router.post('/preview', upload.single('file'), previewImport);
router.post('/execute', upload.single('file'), runImport);
router.get('/template/:entity', downloadTemplate);
router.post('/errors-report', downloadErrorReport);

export const importRoutes = router;
