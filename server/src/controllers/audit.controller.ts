import { Request, Response, NextFunction } from 'express';
import { AuditService } from '../services/audit.service';
import { sendSuccess } from '../utils/responseFormatter';

export class AuditController {
  static async getLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const { actorId, entityType, entityId, action, page, limit } = req.query;

      const result = await AuditService.getLogs({
        actorId: actorId as string,
        entityType: entityType as string,
        entityId: entityId as string,
        action: action as any,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });

      return sendSuccess(res, result.logs, 'Audit trail logs retrieved', 200, result.pagination);
    } catch (err) {
      next(err);
    }
  }
}
