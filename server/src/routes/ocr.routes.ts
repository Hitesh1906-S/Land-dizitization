import { Router } from 'express';
import { OcrController } from '../controllers/ocr.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';
import { validateRequest } from '../middleware/validate.middleware.js';
import {
  processOcrSchema,
  verifyExtractedFieldSchema,
  correctFieldSchema,
  rejectFieldSchema,
  sendBackCorrectionSchema,
  approveCompleteRecordSchema,
  extractFieldsSchema,
  batchVerifyFieldsSchema,
} from '../schemas/index.js';
import { UserRole } from '../constants/index.js';

const router = Router();

// OCR Process & Extraction
router.post('/process', authenticate, validateRequest(processOcrSchema), OcrController.startJob);
router.post('/extract-fields', authenticate, validateRequest(extractFieldsSchema), OcrController.extractFieldsFromText);
router.get('/document/:documentId', authenticate, OcrController.getResultByDocumentId);
router.get('/status/:documentId', authenticate, OcrController.getResultByDocumentId);

// Granular Field-Level Verification Actions (Revenue Officer / Admin)
router.post(
  '/field/:fieldId/approve',
  authenticate,
  authorize([UserRole.REVENUE_OFFICER, UserRole.ADMIN]),
  OcrController.approveField
);

router.post(
  '/field/:fieldId/correct',
  authenticate,
  authorize([UserRole.REVENUE_OFFICER, UserRole.ADMIN]),
  validateRequest(correctFieldSchema),
  OcrController.correctField
);

router.post(
  '/field/:fieldId/reject',
  authenticate,
  authorize([UserRole.REVENUE_OFFICER, UserRole.ADMIN]),
  validateRequest(rejectFieldSchema),
  OcrController.rejectField
);

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

// Record-Level & Workflow Officer Actions
router.post(
  '/document/:documentId/approve-record',
  authenticate,
  authorize([UserRole.REVENUE_OFFICER, UserRole.ADMIN]),
  validateRequest(approveCompleteRecordSchema),
  OcrController.approveCompleteRecord
);

router.post(
  '/document/:documentId/send-back',
  authenticate,
  authorize([UserRole.REVENUE_OFFICER, UserRole.ADMIN]),
  validateRequest(sendBackCorrectionSchema),
  OcrController.sendBackForCorrection
);

export default router;
