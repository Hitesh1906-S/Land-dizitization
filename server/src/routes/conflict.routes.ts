import { Router } from 'express';
import { ConflictController } from '../controllers/conflict.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';
import { validateRequest } from '../middleware/validate.middleware.js';
import { resolveConflictSchema } from '../schemas/index.js';
import { UserRole } from '../constants/index.js';

const router = Router();

// List all conflicts / duplicate candidates
router.get('/', authenticate, ConflictController.listConflicts);

// Trigger on-demand duplicate detection scan across all records or for a specific location
router.post(
  '/scan-all',
  authenticate,
  authorize([UserRole.REVENUE_OFFICER, UserRole.ADMIN]),
  ConflictController.scanAllRecords
);

// Trigger duplicate detection scan for a specific land record
router.post(
  '/scan/:landRecordId',
  authenticate,
  authorize([UserRole.REVENUE_OFFICER, UserRole.ADMIN]),
  ConflictController.scanRecordForDuplicates
);

// Get conflict / candidate by ID
router.get('/:id', authenticate, ConflictController.getConflictById);

// Authorized Human Review & Conflict Resolution (Strictly no auto-merging)
router.patch(
  '/:id/resolve',
  authenticate,
  authorize([UserRole.REVENUE_OFFICER, UserRole.ADMIN]),
  validateRequest(resolveConflictSchema),
  ConflictController.resolveConflict
);

export default router;
