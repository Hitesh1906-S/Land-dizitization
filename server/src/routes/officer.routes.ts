import { Router } from 'express';
import { OfficerController } from '../controllers/officer.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { UserRole } from '../constants';

const router = Router();

// All officer routes require authentication and REVENUE_OFFICER or ADMIN role
router.use(authenticate, authorize([UserRole.REVENUE_OFFICER, UserRole.ADMIN]));

// Real Database Dashboard Stats
router.get('/stats', OfficerController.getStats);

// Operational Queues
router.get('/queues/pending', OfficerController.getPendingQueue);
router.get('/queues/low-confidence-ocr', OfficerController.getOcrQueue);
router.get('/queues/validation-conflicts', OfficerController.getValidationConflictsQueue);
router.get('/queues/duplicate-candidates', OfficerController.getDuplicatesQueue);
router.get('/queues/recent-activity', OfficerController.getRecentActivity);

// Officer Actions with Audit Logging
router.post('/records/:id/approve', OfficerController.approveRecord);
router.post('/records/:id/reject', OfficerController.rejectRecord);
router.post('/records/:id/validate', OfficerController.runValidation);
router.patch('/validation/issues/:issueId/resolve', OfficerController.resolveValidationIssue);

export default router;
