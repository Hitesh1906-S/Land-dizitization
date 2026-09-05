import { Router } from 'express';
import { RecordController } from '../controllers/record.controller';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { createLandRecordSchema, updateLandRecordSchema, searchLandRecordsSchema } from '../schemas';
import { UserRole } from '../constants';

const router = Router();

// Search & Directory endpoints
router.get('/', optionalAuthenticate, validateRequest(searchLandRecordsSchema), RecordController.search);
router.get('/search', optionalAuthenticate, validateRequest(searchLandRecordsSchema), RecordController.search);
router.get('/:id', optionalAuthenticate, RecordController.getById);

// Create new land record (Revenue Officer or Admin)
router.post(
  '/',
  authenticate,
  authorize([UserRole.REVENUE_OFFICER, UserRole.ADMIN]),
  validateRequest(createLandRecordSchema),
  RecordController.create
);

// Update land record details or status (Revenue Officer or Admin)
router.patch(
  '/:id',
  authenticate,
  authorize([UserRole.REVENUE_OFFICER, UserRole.ADMIN]),
  validateRequest(updateLandRecordSchema),
  RecordController.update
);

router.put(
  '/:id',
  authenticate,
  authorize([UserRole.REVENUE_OFFICER, UserRole.ADMIN]),
  validateRequest(updateLandRecordSchema),
  RecordController.update
);

export default router;
