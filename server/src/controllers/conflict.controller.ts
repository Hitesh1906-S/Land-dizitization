import { Request, Response, NextFunction } from 'express';
import { ConflictService } from '../services/conflict.service.js';
import { ConflictStatus, ConflictType } from '@land-digitization/shared';

export class ConflictController {
  static async listConflicts(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, conflictType, landRecordId } = req.query;
      const conflicts = await ConflictService.listConflicts({
        status: status as ConflictStatus,
        conflictType: conflictType as ConflictType,
        landRecordId: landRecordId as string,
      });

      res.status(200).json({
        success: true,
        data: conflicts,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getConflictById(req: Request, res: Response, next: NextFunction) {
    try {
      const conflict = await ConflictService.getConflictById(req.params.id);
      res.status(200).json({
        success: true,
        data: conflict,
      });
    } catch (err) {
      next(err);
    }
  }

  static async resolveConflict(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const userId = user?.id || 'admin-user-id';
      const actorRole = user?.role || 'REVENUE_OFFICER';

      const resolved = await ConflictService.resolveConflict(req.params.id, {
        status: req.body.status,
        resolutionNotes: req.body.resolutionNotes,
        resolvedById: userId,
        actorRole,
      });

      res.status(200).json({
        success: true,
        message: 'Conflict resolved successfully with audit log entry',
        data: resolved,
      });
    } catch (err) {
      next(err);
    }
  }

  static async scanRecordForDuplicates(req: Request, res: Response, next: NextFunction) {
    try {
      const officerId = (req as any).user?.id;
      const result = await ConflictService.scanRecordForDuplicates(req.params.landRecordId, officerId);

      res.status(200).json({
        success: true,
        message: `Duplicate detection scan complete. Found ${result.candidatesFound} candidate(s).`,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async scanAllRecords(req: Request, res: Response, next: NextFunction) {
    try {
      const officerId = (req as any).user?.id;
      const locationId = req.query.locationId as string | undefined;
      const result = await ConflictService.scanAllRecords(locationId, officerId);

      res.status(200).json({
        success: true,
        message: `Global duplicate scan complete. Evaluated pairs and found ${result.candidatesFound} candidate(s).`,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}
