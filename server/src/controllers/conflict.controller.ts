import { Request, Response, NextFunction } from 'express';
import { ConflictService } from '../services/conflict.service';
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
      const userId = (req as any).user?.id || 'admin-user-id';
      const resolved = await ConflictService.resolveConflict(req.params.id, {
        status: req.body.status,
        resolutionNotes: req.body.resolutionNotes,
        resolvedById: userId,
      });

      res.status(200).json({
        success: true,
        message: 'Conflict resolved successfully',
        data: resolved,
      });
    } catch (err) {
      next(err);
    }
  }
}
