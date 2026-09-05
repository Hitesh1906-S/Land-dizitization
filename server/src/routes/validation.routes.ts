import { Router } from 'express';
import { ValidationController } from '../controllers/validation.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/verify', authenticate, ValidationController.validateRecord);

export default router;
