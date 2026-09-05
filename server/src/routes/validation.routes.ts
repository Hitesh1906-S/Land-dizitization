import { Router } from 'express';
import { ValidationController } from '../controllers/validation.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';
import { validateRequest } from '../middleware/validate.middleware.js';
import { runValidationSchema, resolveValidationIssueSchema } from '../schemas/index.js';
import { UserRole } from '../constants/index.js';

const router = Router();

router.post('/verify', authenticate, validateRequest(runValidationSchema), ValidationController.validateRecord);
router.post('/run/:landRecordId', authenticate, ValidationController.validateRecord);
router.post('/run', authenticate, validateRequest(runValidationSchema), ValidationController.validateRecord);
router.get('/record/:landRecordId', authenticate, ValidationController.getLatestValidation);
router.get('/history/:landRecordId', authenticate, ValidationController.getHistory);

router.patch(
  '/issue/:issueId/resolve',
  authenticate,
  authorize([UserRole.REVENUE_OFFICER, UserRole.ADMIN]),
  validateRequest(resolveValidationIssueSchema),
  ValidationController.resolveIssue
);

export default router;
