import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { registerSchema, loginSchema } from '../schemas';

const router = Router();

router.post('/register', validateRequest(registerSchema), AuthController.register);
router.post('/login', validateRequest(loginSchema), AuthController.login);
router.post('/refresh', AuthController.refresh);
router.get('/me', authenticate, AuthController.me);
router.post('/logout', authenticate, AuthController.logout);

export default router;
