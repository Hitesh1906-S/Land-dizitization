import { Router } from 'express';
import { WorkflowController } from '../controllers/workflow.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { UserRole } from '../constants';

const router = Router();

router.get('/', authenticate, WorkflowController.getRequests);
router.post('/', authenticate, WorkflowController.submit);
router.patch(
  '/:id/stage',
  authenticate,
  authorize([UserRole.REVENUE_OFFICER, UserRole.ADMIN]),
  WorkflowController.updateStage
);

export default router;
