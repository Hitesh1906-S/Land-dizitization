import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../services/admin.service';
import { sendSuccess } from '../utils/responseFormatter';
import { HTTP_STATUS } from '../constants';
import { BadRequestError } from '../utils/AppError';

export class AdminController {
  static async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await AdminService.getDashboardStats();
      return sendSuccess(res, stats, 'Administrator statistics retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  // 1. User Management
  static async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const { role, isActive, search, district, page, limit } = req.query;
      const result = await AdminService.getUsers({
        role: role as string,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
        search: search as string,
        district: district as string,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });
      return sendSuccess(res, result.users, 'Users retrieved successfully', HTTP_STATUS.OK, result.pagination);
    } catch (err) {
      next(err);
    }
  }

  static async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await AdminService.getUserById(id);
      return sendSuccess(res, user, 'User details retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, fullName, phone, role, jurisdictionDistrict, jurisdictionTehsil } =
        req.body;

      if (!email || !password || !fullName || !role) {
        throw new BadRequestError('Email, password, fullName, and role are required');
      }

      const user = await AdminService.createUser(
        {
          email,
          password,
          fullName,
          phone,
          role,
          jurisdictionDistrict,
          jurisdictionTehsil,
        },
        req.user!.id
      );

      return sendSuccess(res, user, 'User created successfully', HTTP_STATUS.CREATED);
    } catch (err) {
      next(err);
    }
  }

  static async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { fullName, phone, role, jurisdictionDistrict, jurisdictionTehsil, isActive } = req.body;

      const updated = await AdminService.updateUser(
        id,
        {
          fullName,
          phone,
          role,
          jurisdictionDistrict,
          jurisdictionTehsil,
          isActive,
        },
        req.user!.id
      );

      return sendSuccess(res, updated, 'User updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async toggleUserStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await AdminService.toggleUserStatus(id, req.user!.id);
      return sendSuccess(res, updated, 'User status toggled successfully');
    } catch (err) {
      next(err);
    }
  }

  // 2. Role Management
  static async getRoles(req: Request, res: Response, next: NextFunction) {
    try {
      const roles = await AdminService.getRoles();
      return sendSuccess(res, roles, 'Roles retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  static async updateRolePermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { permissions, description } = req.body;

      if (!Array.isArray(permissions)) {
        throw new BadRequestError('Permissions must be an array of permission strings');
      }

      const updated = await AdminService.updateRolePermissions(
        id,
        permissions,
        description,
        req.user!.id
      );
      return sendSuccess(res, updated, 'Role permissions updated successfully');
    } catch (err) {
      next(err);
    }
  }

  // 3. Land Record Oversight
  static async getRecords(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, landType, search, district, village, page, limit } = req.query;
      const result = await AdminService.getRecords({
        status: status as string,
        landType: landType as string,
        search: search as string,
        district: district as string,
        village: village as string,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });
      return sendSuccess(res, result.records, 'Records retrieved', HTTP_STATUS.OK, result.pagination);
    } catch (err) {
      next(err);
    }
  }

  static async updateRecordStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status, remarks } = req.body;

      if (!status) {
        throw new BadRequestError('Status is required');
      }

      const updated = await AdminService.updateRecordStatus(id, status, remarks, req.user!.id);
      return sendSuccess(res, updated, 'Land record status updated');
    } catch (err) {
      next(err);
    }
  }

  // 4. Request Governance
  static async getRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const { stage, requestType, assignedOfficerId, search, page, limit } = req.query;
      const result = await AdminService.getRequests({
        stage: stage as string,
        requestType: requestType as string,
        assignedOfficerId: assignedOfficerId as string,
        search: search as string,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });
      return sendSuccess(res, result.requests, 'Requests retrieved', HTTP_STATUS.OK, result.pagination);
    } catch (err) {
      next(err);
    }
  }

  static async assignOfficer(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { officerId } = req.body;

      if (!officerId) {
        throw new BadRequestError('Officer ID is required');
      }

      const updated = await AdminService.assignOfficer(id, officerId, req.user!.id);
      return sendSuccess(res, updated, 'Request assigned to officer successfully');
    } catch (err) {
      next(err);
    }
  }

  static async updateRequestStage(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { stage, reason } = req.body;

      if (!stage) {
        throw new BadRequestError('Stage is required');
      }

      const updated = await AdminService.updateRequestStage(id, stage, reason, req.user!.id);
      return sendSuccess(res, updated, 'Request stage updated');
    } catch (err) {
      next(err);
    }
  }

  // 5. Validation Monitoring
  static async getValidationMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const metrics = await AdminService.getValidationMetrics();
      return sendSuccess(res, metrics, 'Validation metrics retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  static async getValidationIssues(req: Request, res: Response, next: NextFunction) {
    try {
      const { severity, ruleCode, isResolved, page, limit } = req.query;
      const result = await AdminService.getValidationIssues({
        severity: severity as string,
        ruleCode: ruleCode as string,
        isResolved: isResolved !== undefined ? isResolved === 'true' : undefined,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });
      return sendSuccess(res, result.issues, 'Validation issues retrieved', HTTP_STATUS.OK, result.pagination);
    } catch (err) {
      next(err);
    }
  }

  // 6. Audit Trail
  static async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const { action, entityType, actorId, search, page, limit } = req.query;
      const result = await AdminService.getAuditLogs({
        action: action as string,
        entityType: entityType as string,
        actorId: actorId as string,
        search: search as string,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });
      return sendSuccess(res, result.logs, 'Audit trail logs retrieved', HTTP_STATUS.OK, result.pagination);
    } catch (err) {
      next(err);
    }
  }
}
