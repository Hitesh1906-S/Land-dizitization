import { Router } from 'express';
import { ConflictController } from '../controllers/conflict.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { resolveConflictSchema } from '../schemas';

const router = Router();

router.get('/', authenticate, ConflictController.listConflicts);
router.get('/:id', authenticate, ConflictController.getConflictById);
router.patch('/:id/resolve', authenticate, validateRequest(resolveConflictSchema), ConflictController.resolveConflict);

export default router;
