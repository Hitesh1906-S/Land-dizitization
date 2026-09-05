import { Request, Response, NextFunction } from 'express';
import { OfficerService } from '../services/officer.service';
import { sendSuccess } from '../utils/responseFormatter';
import { HTTP_STATUS } from '../constants';

export class OfficerController {
  static async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await OfficerService.getDashboardStats();
      return sendSuccess(res, stats, 'Officer dashboard stats retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  static async getPendingQueue(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = req.query;
      const result = await OfficerService.getPendingVerificationQueue({
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });
      return sendSuccess(res, result.items, 'Pending verification queue retrieved', HTTP_STATUS.OK, result.pagination);
    } catch (err) {
      next(err);
    }
  }

  static async getOcrQueue(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, threshold } = req.query;
      const result = await OfficerService.getLowConfidenceOcrQueue({
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        threshold: threshold ? parseFloat(threshold as string) : undefined,
      });
      return sendSuccess(res, result.items, 'Low confidence OCR queue retrieved', HTTP_STATUS.OK, result.pagination);
    } catch (err) {
      next(err);
    }
  }

  static async getValidationConflictsQueue(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = req.query;
      const result = await OfficerService.getValidationConflictsQueue({
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });
      return sendSuccess(res, result.items, 'Validation conflicts queue retrieved', HTTP_STATUS.OK, result.pagination);
    } catch (err) {
      next(err);
    }
  }

  static async getDuplicatesQueue(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = req.query;
      const result = await OfficerService.getDuplicateCandidatesQueue({
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });
      return sendSuccess(res, result.items, 'Duplicate candidates queue retrieved', HTTP_STATUS.OK, result.pagination);
    } catch (err) {
      next(err);
    }
  }

  static async getRecentActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const { limit } = req.query;
      const result = await OfficerService.getRecentActivity({
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });
      return sendSuccess(res, result, 'Recent activity audit logs retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async approveRecord(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { remarks } = req.body;
      const result = await OfficerService.approveRecord(id, req.user!.id, remarks);
      return sendSuccess(res, result, 'Land record successfully approved and verified');
    } catch (err) {
      next(err);
    }
  }

  static async rejectRecord(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const result = await OfficerService.rejectRecord(id, req.user!.id, reason);
      return sendSuccess(res, result, 'Land record marked as disputed / rejected');
    } catch (err) {
      next(err);
    }
  }

  static async runValidation(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await OfficerService.runValidation(id, req.user!.id);
      return sendSuccess(res, result, 'Validation executed on demand');
    } catch (err) {
      next(err);
    }
  }

  static async resolveValidationIssue(req: Request, res: Response, next: NextFunction) {
    try {
      const { issueId } = req.params;
      const { notes } = req.body;
      const result = await OfficerService.resolveValidationIssue(issueId, req.user!.id, notes);
      return sendSuccess(res, result, 'Validation issue resolved');
    } catch (err) {
      next(err);
    }
  }
}
