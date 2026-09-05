import { Router } from 'express';
import { ValidationController } from '../controllers/validation.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { runValidationSchema } from '../schemas';

const router = Router();

router.post('/verify', authenticate, validateRequest(runValidationSchema), ValidationController.validateRecord);
router.get('/history/:landRecordId', authenticate, ValidationController.getHistory);

export default router;
