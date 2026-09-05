import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { UserRole } from '../constants';

const router = Router();

// All Admin routes strictly require authentication and ADMIN role
router.use(authenticate, authorize([UserRole.ADMIN]));

// Real Database Dashboard Stats
router.get('/stats', AdminController.getStats);

// 1. User Management
router.get('/users', AdminController.getUsers);
router.get('/users/:id', AdminController.getUserById);
router.post('/users', AdminController.createUser);
router.patch('/users/:id', AdminController.updateUser);
router.patch('/users/:id/toggle-status', AdminController.toggleUserStatus);

// 2. Role Management
router.get('/roles', AdminController.getRoles);
router.patch('/roles/:id', AdminController.updateRolePermissions);

// 3. Land Record Governance
router.get('/records', AdminController.getRecords);
router.patch('/records/:id/status', AdminController.updateRecordStatus);

// 4. Request Governance
router.get('/requests', AdminController.getRequests);
router.patch('/requests/:id/assign', AdminController.assignOfficer);
router.patch('/requests/:id/stage', AdminController.updateRequestStage);

// 5. Validation Monitoring
router.get('/validation/metrics', AdminController.getValidationMetrics);
router.get('/validation/issues', AdminController.getValidationIssues);

// 6. Audit Trail
router.get('/audit-logs', AdminController.getAuditLogs);

export default router;
