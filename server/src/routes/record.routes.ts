import { Router } from 'express';
import { RecordController } from '../controllers/record.controller';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { createLandRecordSchema, searchLandRecordsSchema } from '../schemas';
import { UserRole } from '../constants';

const router = Router();

router.get('/', optionalAuthenticate, validateRequest(searchLandRecordsSchema), RecordController.search);
router.get('/:id', optionalAuthenticate, RecordController.getById);
router.post(
  '/',
  authenticate,
  authorize([UserRole.REVENUE_OFFICER, UserRole.ADMIN]),
  validateRequest(createLandRecordSchema),
  RecordController.create
);

export default router;
