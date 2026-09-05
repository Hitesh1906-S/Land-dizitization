import { prisma } from '../config/database';
import { AuditLogDTO, UserRole, AuditAction } from '@land-digitization/shared';

export class AuditService {
  static async getLogs(filters: {
    actorId?: string;
    entityType?: string;
    entityId?: string;
    action?: AuditAction;
    limit?: number;
    page?: number;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.actorId) where.actorId = filters.actorId;
    if (filters.entityType) where.entityType = filters.entityType;
    if (filters.entityId) where.entityId = filters.entityId;
    if (filters.action) where.action = filters.action;

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        include: {
          actor: {
            select: {
              fullName: true,
              email: true,
            },
          },
        },
        orderBy: { timestamp: 'desc' },
      }),
    ]);

    return {
      logs: logs.map(this.mapToDTO),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static mapToDTO(log: any): AuditLogDTO {
    return {
      id: log.id,
      actorId: log.actorId,
      actorRole: log.actorRole as UserRole,
      action: log.action as AuditAction,
      entityType: log.entityType,
      entityId: log.entityId,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      snapshotDiff: log.snapshotDiffJson,
      timestamp: log.timestamp.toISOString(),
      actor: log.actor,
    };
  }
}
