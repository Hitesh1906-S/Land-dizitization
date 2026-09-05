import { Request, Response, NextFunction } from 'express';
import { AuditAction, UserRole } from '../constants';
import { prisma } from '../config/database';

export function createAuditLog(
  action: AuditAction,
  entityType: string,
  getEntityId: (req: Request, res: Response) => string,
  getSnapshotDiff?: (req: Request, res: Response) => any
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Intercept response finish
    res.on('finish', async () => {
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        try {
          const entityId = getEntityId(req, res);
          if (!entityId) return;

          const snapshotDiff = getSnapshotDiff ? getSnapshotDiff(req, res) : undefined;

          await prisma.auditLog.create({
            data: {
              actorId: req.user.id,
              actorRole: req.user.role as string,
              action,
              entityType,
              entityId,
              ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress,
              userAgent: req.headers['user-agent'],
              snapshotDiffJson: snapshotDiff ? JSON.stringify(snapshotDiff) : null,
            },
          });
        } catch (auditErr) {
          console.error('⚠️ Failed to write audit log:', auditErr);
        }
      }
    });

    next();
  };
}
