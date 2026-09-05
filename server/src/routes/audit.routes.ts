import { Router } from 'express';
import { AuditController } from '../controllers/audit.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { UserRole } from '../constants';

const router = Router();

router.get(
  '/',
  authenticate,
  authorize([UserRole.ADMIN, UserRole.REVENUE_OFFICER]),
  AuditController.getLogs
);

export default router;
