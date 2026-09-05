import { Router } from 'express';
import { OcrController } from '../controllers/ocr.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { processOcrSchema, verifyExtractedFieldSchema } from '../schemas';
import { UserRole } from '../constants';

const router = Router();

router.post('/process', authenticate, validateRequest(processOcrSchema), OcrController.startJob);
router.get('/document/:documentId', authenticate, OcrController.getResultByDocumentId);
router.get('/status/:documentId', authenticate, OcrController.getResultByDocumentId);
router.patch(
  '/field/:fieldId/verify',
  authenticate,
  authorize([UserRole.REVENUE_OFFICER, UserRole.ADMIN]),
  validateRequest(verifyExtractedFieldSchema),
  OcrController.verifyField
);

export default router;
