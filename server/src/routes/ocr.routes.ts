import { Router } from 'express';
import { OcrController } from '../controllers/ocr.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { processOcrSchema, verifyExtractedFieldSchema } from '../schemas';

const router = Router();

router.post('/process', authenticate, validateRequest(processOcrSchema), OcrController.startJob);
router.get('/document/:documentId', authenticate, OcrController.getResultByDocumentId);
router.patch('/field/:fieldId/verify', authenticate, validateRequest(verifyExtractedFieldSchema), OcrController.verifyField);

export default router;
