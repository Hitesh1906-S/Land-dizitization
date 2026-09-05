import { Router } from 'express';
import { WorkflowController } from '../controllers/workflow.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { createRequestSchema, updateRequestStageSchema } from '../schemas';
import { UserRole } from '../constants';

const router = Router();

router.get('/', authenticate, WorkflowController.getRequests);
router.get('/:id', authenticate, WorkflowController.getById);
router.post('/', authenticate, validateRequest(createRequestSchema), WorkflowController.submit);
router.patch(
  '/:id/stage',
  authenticate,
  authorize([UserRole.REVENUE_OFFICER, UserRole.ADMIN]),
  validateRequest(updateRequestStageSchema),
  WorkflowController.updateStage
);

export default router;
