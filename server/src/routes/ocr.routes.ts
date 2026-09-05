import { Router } from 'express';
import { OcrController } from '../controllers/ocr.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/process', authenticate, OcrController.startJob);
router.get('/job/:jobId', authenticate, OcrController.getJobStatus);

export default router;
