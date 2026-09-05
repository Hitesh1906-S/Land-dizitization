import { Router } from 'express';
import { OcrController } from '../controllers/ocr.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';
import { validateRequest } from '../middleware/validate.middleware.js';
import {
  processOcrSchema,
  verifyExtractedFieldSchema,
  extractFieldsSchema,
  batchVerifyFieldsSchema,
} from '../schemas/index.js';
import { UserRole } from '../constants/index.js';

const router = Router();

router.post('/process', authenticate, validateRequest(processOcrSchema), OcrController.startJob);
router.post('/extract-fields', authenticate, validateRequest(extractFieldsSchema), OcrController.extractFieldsFromText);
router.get('/document/:documentId', authenticate, OcrController.getResultByDocumentId);
router.get('/status/:documentId', authenticate, OcrController.getResultByDocumentId);

router.patch(
  '/field/:fieldId/verify',
  authenticate,
  authorize([UserRole.REVENUE_OFFICER, UserRole.ADMIN]),
  validateRequest(verifyExtractedFieldSchema),
  OcrController.verifyField
);

router.post(
  '/document/:documentId/verify-all',
  authenticate,
  authorize([UserRole.REVENUE_OFFICER, UserRole.ADMIN]),
  validateRequest(batchVerifyFieldsSchema),
  OcrController.batchVerifyFields
);

export default router;
