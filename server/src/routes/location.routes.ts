import { Router } from 'express';
import { LocationController } from '../controllers/location.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { createLocationSchema } from '../schemas';
import { UserRole } from '../constants';

const router = Router();

router.get('/', LocationController.getAll);
router.get('/:id', LocationController.getById);
router.post(
  '/',
  authenticate,
  authorize([UserRole.ADMIN, UserRole.REVENUE_OFFICER]),
  validateRequest({ body: createLocationSchema }),
  LocationController.create
);

export default router;
