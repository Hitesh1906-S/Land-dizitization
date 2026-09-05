import { prisma } from '../config/database';
import { NotFoundError, BadRequestError } from '../utils/AppError';
import { RecordStatus, AuditAction, ConflictStatus } from '@land-digitization/shared';
import { ValidationEngine } from './validation/validation.engine';
import { RecordService } from './record.service';

export interface OfficerDashboardStats {
  totalRecords: number;
  digitized: number;
  verified: number;
  pending: number;
  conflicts: number;
  duplicates: number;
}

export class OfficerService {
  /**
   * Get real-time aggregated dashboard numbers from PostgreSQL database
   */
  static async getDashboardStats(): Promise<OfficerDashboardStats> {
    const [totalRecords, digitized, verified, pending, validationConflicts, duplicateConflicts] =
      await Promise.all([
        prisma.landRecord.count(),
        prisma.landRecord.count({
          where: {
            OR: [
              { documents: { some: {} } },
              { status: { in: [RecordStatus.VERIFIED, RecordStatus.PENDING_VERIFICATION, RecordStatus.DISPUTED] } },
            ],
          },
        }),
        prisma.landRecord.count({
          where: { status: RecordStatus.VERIFIED },
        }),
        prisma.landRecord.count({
          where: { status: RecordStatus.PENDING_VERIFICATION },
        }),
        prisma.validationIssue.count({
          where: {
            isResolved: false,
            severity: { in: ['CRITICAL', 'WARNING'] },
          },
        }),
        prisma.duplicateCandidate.count({
          where: {
            status: { in: [ConflictStatus.OPEN, ConflictStatus.INVESTIGATING] },
          },
        }),
      ]);

    return {
      totalRecords,
      digitized,
      verified,
      pending,
      conflicts: validationConflicts + duplicateConflicts,
      duplicates: duplicateConflicts,
    };
  }

  /**
   * Operational Queue 1: Pending Verification Records
   */
  static async getPendingVerificationQueue(options: { page?: number; limit?: number } = {}) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const where = {
      status: RecordStatus.PENDING_VERIFICATION,
    };

    const [total, records] = await Promise.all([
      prisma.landRecord.count({ where }),
      prisma.landRecord.findMany({
        where,
        skip,
        take: limit,
        include: {
          location: true,
          owners: true,
          parcel: true,
          documents: {
            include: { ocrResult: true },
          },
          validationResults: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: { issues: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      items: records.map((r) => ({
        ...RecordService.mapToDTO(r),
        latestValidation: r.validationResults[0]
          ? {
              id: r.validationResults[0].id,
              isValid: r.validationResults[0].isValid,
              overallScore: r.validationResults[0].overallScore,
              summary: r.validationResults[0].summary,
              issuesCount: r.validationResults[0].issues?.length || 0,
              createdAt: r.validationResults[0].createdAt.toISOString(),
            }
          : null,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Operational Queue 2: Low-Confidence OCR Documents & Unverified Extracted Fields
   */
  static async getLowConfidenceOcrQueue(options: { page?: number; limit?: number; threshold?: number } = {}) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;
    const threshold = options.threshold ?? 0.85;

    // Find OCR results where score is low or has unverified fields
    const where = {
      OR: [
        { confidenceScore: { lte: threshold } },
        { extractedFields: { some: { isVerified: false } } },
        { status: { in: ['QUEUED', 'PROCESSING'] } },
      ],
    };

    const [total, ocrResults] = await Promise.all([
      prisma.oCRResult.count({ where }),
      prisma.oCRResult.findMany({
        where,
        skip,
        take: limit,
        include: {
          document: {
            include: {
              landRecord: {
                include: {
                  location: true,
                  owners: true,
                },
              },
            },
          },
          extractedFields: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      items: ocrResults.map((res) => ({
        ocrResultId: res.id,
        documentId: res.documentId,
        fileName: res.document.fileName,
        fileType: res.document.fileType,
        filePath: res.document.filePath,
        documentType: res.document.documentType,
        status: res.status,
        confidenceScore: res.confidenceScore ?? 0,
        engine: res.engine,
        pageCount: res.pageCount,
        createdAt: res.createdAt.toISOString(),
        landRecord: res.document.landRecord
          ? {
              id: res.document.landRecord.id,
              ulpin: res.document.landRecord.ulpin,
              khasraNumber: res.document.landRecord.khasraNumber,
              village: res.document.landRecord.location?.village,
              district: res.document.landRecord.location?.district,
              primaryOwner: res.document.landRecord.owners.find((o) => o.isPrimary)?.fullName || res.document.landRecord.owners[0]?.fullName,
            }
          : null,
        extractedFields: res.extractedFields.map((f) => ({
          id: f.id,
          fieldName: f.fieldName,
          fieldValue: f.fieldValue,
          confidence: f.confidence,
          isVerified: f.isVerified,
          verifiedValue: f.verifiedValue,
        })),
        lowConfidenceFieldsCount: res.extractedFields.filter((f) => f.confidence < threshold).length,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Operational Queue 3: Validation Conflicts & Rule Violations
   */
  static async getValidationConflictsQueue(options: { page?: number; limit?: number } = {}) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const where = {
      isResolved: false,
    };

    const [total, issues] = await Promise.all([
      prisma.validationIssue.count({ where }),
      prisma.validationIssue.findMany({
        where,
        skip,
        take: limit,
        include: {
          validationResult: {
            include: {
              landRecord: {
                include: {
                  location: true,
                  owners: true,
                },
              },
            },
          },
        },
        orderBy: [{ severity: 'asc' }, { validationResult: { createdAt: 'desc' } }],
      }),
    ]);

    return {
      items: issues.map((issue) => {
        let details = null;
        if (issue.detailsJson) {
          try {
            details = typeof issue.detailsJson === 'string' ? JSON.parse(issue.detailsJson) : issue.detailsJson;
          } catch {
            details = issue.detailsJson;
          }
        }

        const record = issue.validationResult?.landRecord;
        return {
          id: issue.id,
          validationResultId: issue.validationResultId,
          ruleCode: issue.ruleCode,
          severity: issue.severity,
          title: issue.title,
          description: issue.description,
          details,
          isResolved: issue.isResolved,
          createdAt: issue.validationResult?.createdAt.toISOString(),
          record: record
            ? {
                id: record.id,
                ulpin: record.ulpin,
                khasraNumber: record.khasraNumber,
                khatauniNumber: record.khatauniNumber,
                areaInSqMeters: record.areaInSqMeters,
                village: record.location?.village,
                district: record.location?.district,
                primaryOwner: record.owners.find((o) => o.isPrimary)?.fullName || record.owners[0]?.fullName,
              }
            : null,
        };
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Operational Queue 4: Duplicate Candidates & Spatial Overlaps
   */
  static async getDuplicateCandidatesQueue(options: { page?: number; limit?: number } = {}) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const where = {
      status: { in: [ConflictStatus.OPEN, ConflictStatus.INVESTIGATING] },
    };

    const [total, candidates] = await Promise.all([
      prisma.duplicateCandidate.count({ where }),
      prisma.duplicateCandidate.findMany({
        where,
        skip,
        take: limit,
        include: {
          primaryRecord: {
            include: {
              location: true,
              owners: true,
            },
          },
          conflictingRecord: {
            include: {
              location: true,
              owners: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      items: candidates.map((c) => {
        let scoreBreakdown = null;
        if (c.resolutionNotes && c.resolutionNotes.startsWith('{')) {
          try {
            scoreBreakdown = JSON.parse(c.resolutionNotes);
          } catch {
            // Keep null
          }
        }

        return {
          id: c.id,
          conflictType: c.conflictType,
          overlapPercentage: c.overlapPercentage,
          overlapAreaSqM: c.overlapAreaSqM,
          status: c.status,
          resolutionNotes: c.resolutionNotes,
          createdAt: c.createdAt.toISOString(),
          primaryRecord: c.primaryRecord
            ? {
                id: c.primaryRecord.id,
                ulpin: c.primaryRecord.ulpin,
                khasraNumber: c.primaryRecord.khasraNumber,
                village: c.primaryRecord.location?.village,
                district: c.primaryRecord.location?.district,
                areaInSqMeters: c.primaryRecord.areaInSqMeters,
                primaryOwner:
                  c.primaryRecord.owners.find((o) => o.isPrimary)?.fullName || c.primaryRecord.owners[0]?.fullName,
              }
            : null,
          conflictingRecord: c.conflictingRecord
            ? {
                id: c.conflictingRecord.id,
                ulpin: c.conflictingRecord.ulpin,
                khasraNumber: c.conflictingRecord.khasraNumber,
                village: c.conflictingRecord.location?.village,
                district: c.conflictingRecord.location?.district,
                areaInSqMeters: c.conflictingRecord.areaInSqMeters,
                primaryOwner:
                  c.conflictingRecord.owners.find((o) => o.isPrimary)?.fullName ||
                  c.conflictingRecord.owners[0]?.fullName,
              }
            : null,
          scoreBreakdown,
        };
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Operational Queue 5: Recent Activity & Audit Trail Stream
   */
  static async getRecentActivity(options: { limit?: number } = {}) {
    const limit = Math.min(50, Math.max(1, options.limit || 15));

    const logs = await prisma.auditLog.findMany({
      take: limit,
      include: {
        actor: {
          select: {
            id: true,
            fullName: true,
            email: true,
            roleName: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    return logs.map((log) => {
      let snapshotDiff = null;
      if (log.snapshotDiffJson) {
        try {
          snapshotDiff = typeof log.snapshotDiffJson === 'string' ? JSON.parse(log.snapshotDiffJson) : log.snapshotDiffJson;
        } catch {
          snapshotDiff = log.snapshotDiffJson;
        }
      }

      return {
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        timestamp: log.timestamp.toISOString(),
        actor: log.actor
          ? {
              fullName: log.actor.fullName,
              email: log.actor.email,
              roleName: log.actor.roleName,
            }
          : {
              fullName: 'System Engine',
              email: 'system@bhoomisetu.gov.in',
              roleName: log.actorRole,
            },
        snapshotDiff,
      };
    });
  }

  /**
   * Officer Action 1: Approve Land Record (with mandatory audit log)
   */
  static async approveRecord(recordId: string, officerId: string, remarks?: string) {
    const record = await prisma.landRecord.findUnique({
      where: { id: recordId },
      include: { location: true, owners: true },
    });

    if (!record) {
      throw new NotFoundError(`Land record with ID ${recordId} not found`);
    }

    const previousStatus = record.status;

    // Update record status to VERIFIED
    const updated = await prisma.landRecord.update({
      where: { id: recordId },
      data: { status: RecordStatus.VERIFIED },
      include: { location: true, owners: true, parcel: true },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        actorId: officerId,
        actorRole: 'REVENUE_OFFICER',
        action: AuditAction.VERIFY,
        entityType: 'LandRecord',
        entityId: recordId,
        snapshotDiffJson: JSON.stringify({
          action: 'OFFICER_APPROVE_RECORD',
          previousStatus,
          newStatus: RecordStatus.VERIFIED,
          remarks: remarks || 'Approved by Revenue Officer following comprehensive verification.',
          ulpin: record.ulpin,
          khasraNumber: record.khasraNumber,
        }),
      },
    });

    return RecordService.mapToDTO(updated);
  }

  /**
   * Officer Action 2: Reject / Dispute Land Record (with mandatory audit log)
   */
  static async rejectRecord(recordId: string, officerId: string, reason: string) {
    if (!reason || !reason.trim()) {
      throw new BadRequestError('A valid rejection or dispute reason is mandatory');
    }

    const record = await prisma.landRecord.findUnique({
      where: { id: recordId },
      include: { location: true, owners: true },
    });

    if (!record) {
      throw new NotFoundError(`Land record with ID ${recordId} not found`);
    }

    const previousStatus = record.status;

    // Update status to DISPUTED
    const updated = await prisma.landRecord.update({
      where: { id: recordId },
      data: { status: RecordStatus.DISPUTED },
      include: { location: true, owners: true, parcel: true },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        actorId: officerId,
        actorRole: 'REVENUE_OFFICER',
        action: AuditAction.REJECT_MUTATION,
        entityType: 'LandRecord',
        entityId: recordId,
        snapshotDiffJson: JSON.stringify({
          action: 'OFFICER_REJECT_RECORD',
          previousStatus,
          newStatus: RecordStatus.DISPUTED,
          rejectionReason: reason.trim(),
          ulpin: record.ulpin,
          khasraNumber: record.khasraNumber,
        }),
      },
    });

    return RecordService.mapToDTO(updated);
  }

  /**
   * Officer Action 3: Run Validation on Demand
   */
  static async runValidation(recordId: string, officerId: string) {
    const result = await ValidationEngine.validateRecord(recordId, officerId);

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: officerId,
        actorRole: 'REVENUE_OFFICER',
        action: AuditAction.UPDATE,
        entityType: 'LandRecordValidation',
        entityId: recordId,
        snapshotDiffJson: JSON.stringify({
          action: 'ON_DEMAND_VALIDATION_EXECUTION',
          isValid: result.isValid,
          overallScore: result.overallScore,
          issuesCount: result.issues.length,
        }),
      },
    });

    return result;
  }

  /**
   * Officer Action 4: Resolve Validation Issue
   */
  static async resolveValidationIssue(issueId: string, officerId: string, notes?: string) {
    const issue = await prisma.validationIssue.findUnique({
      where: { id: issueId },
      include: { validationResult: true },
    });

    if (!issue) {
      throw new NotFoundError(`Validation issue ${issueId} not found`);
    }

    const updated = await prisma.validationIssue.update({
      where: { id: issueId },
      data: {
        isResolved: true,
        resolvedById: officerId,
        resolvedAt: new Date(),
        detailsJson: notes ? JSON.stringify({ notes }) : issue.detailsJson,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: officerId,
        actorRole: 'REVENUE_OFFICER',
        action: AuditAction.RESOLVE_CONFLICT,
        entityType: 'ValidationIssue',
        entityId: issueId,
        snapshotDiffJson: JSON.stringify({
          ruleCode: issue.ruleCode,
          resolvedAt: new Date().toISOString(),
          notes: notes || 'Resolved by Revenue Officer',
        }),
      },
    });

    return updated;
  }
}
