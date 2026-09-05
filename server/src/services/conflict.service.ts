import { prisma } from '../config/database.js';
import { NotFoundError, BadRequestError } from '../utils/AppError.js';
import {
  DuplicateCandidateDTO,
  ConflictStatus,
  ConflictType,
  DuplicateScanResultDTO,
} from '@land-digitization/shared';
import { DuplicateDetectorService } from './duplicate/duplicate-detector.service.js';

export class ConflictService {
  /**
   * List duplicate candidates / conflicts with optional filtering
   */
  static async listConflicts(filters?: {
    status?: ConflictStatus;
    conflictType?: ConflictType;
    landRecordId?: string;
  }): Promise<DuplicateCandidateDTO[]> {
    const candidates = await prisma.duplicateCandidate.findMany({
      where: {
        ...(filters?.status && { status: filters.status }),
        ...(filters?.conflictType && { conflictType: filters.conflictType }),
        ...(filters?.landRecordId && {
          OR: [
            { primaryRecordId: filters.landRecordId },
            { conflictingRecordId: filters.landRecordId },
          ],
        }),
      },
      include: {
        primaryRecord: {
          include: { location: true, owners: true, parcel: true },
        },
        conflictingRecord: {
          include: { location: true, owners: true, parcel: true },
        },
        resolvedBy: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return candidates.map((c) => this.mapToDTO(c));
  }

  /**
   * Get conflict / duplicate candidate by ID
   */
  static async getConflictById(id: string): Promise<DuplicateCandidateDTO> {
    const candidate = await prisma.duplicateCandidate.findUnique({
      where: { id },
      include: {
        primaryRecord: {
          include: { location: true, owners: true, parcel: true },
        },
        conflictingRecord: {
          include: { location: true, owners: true, parcel: true },
        },
        resolvedBy: true,
      },
    });

    if (!candidate) {
      throw new NotFoundError(`Duplicate candidate with ID ${id} not found`);
    }

    return this.mapToDTO(candidate);
  }

  /**
   * Authorized Human Review & Conflict Resolution
   * GUARDRAIL: Never automatically merges records. Requires explicit human review.
   * Creates an immutable AuditLog record.
   */
  static async resolveConflict(
    id: string,
    data: {
      status: ConflictStatus;
      resolutionNotes: string;
      resolvedById: string;
      actorRole?: string;
    }
  ): Promise<DuplicateCandidateDTO> {
    const candidate = await prisma.duplicateCandidate.findUnique({
      where: { id },
      include: {
        primaryRecord: true,
        conflictingRecord: true,
      },
    });

    if (!candidate) {
      throw new NotFoundError(`Duplicate candidate with ID ${id} not found`);
    }

    if (!data.resolutionNotes || data.resolutionNotes.trim().length === 0) {
      throw new BadRequestError('Resolution notes and reason are mandatory for human review decisions');
    }

    const previousStatus = candidate.status;

    // Update candidate resolution state
    const updated = await prisma.duplicateCandidate.update({
      where: { id },
      data: {
        status: data.status,
        resolutionNotes: data.resolutionNotes.trim(),
        resolvedById: data.resolvedById,
        resolvedAt: new Date(),
      },
      include: {
        primaryRecord: { include: { location: true, owners: true, parcel: true } },
        conflictingRecord: { include: { location: true, owners: true, parcel: true } },
        resolvedBy: true,
      },
    });

    // Create immutable audit log entry for this human resolution action
    await prisma.auditLog.create({
      data: {
        actorId: data.resolvedById,
        actorRole: data.actorRole || 'REVENUE_OFFICER',
        action: 'RESOLVE_CONFLICT',
        entityType: 'DuplicateCandidate',
        entityId: id,
        snapshotDiffJson: JSON.stringify({
          previousStatus,
          newStatus: data.status,
          primaryRecordId: candidate.primaryRecordId,
          conflictingRecordId: candidate.conflictingRecordId,
          resolutionNotes: data.resolutionNotes,
          resolvedAt: new Date().toISOString(),
          autoMergeBlocked: true,
        }),
      },
    });

    return this.mapToDTO(updated);
  }

  /**
   * Run duplicate detection scan on a single record
   */
  static async scanRecordForDuplicates(
    recordId: string,
    officerId?: string
  ): Promise<DuplicateScanResultDTO> {
    const target = await prisma.landRecord.findUnique({
      where: { id: recordId },
    });

    if (!target) {
      throw new NotFoundError(`Land record with ID ${recordId} not found`);
    }

    const comparisons = await DuplicateDetectorService.scanRecord(recordId);

    // Fetch the updated candidate records
    const candidates = await this.listConflicts({ landRecordId: recordId });

    if (officerId) {
      await prisma.auditLog.create({
        data: {
          actorId: officerId,
          actorRole: 'REVENUE_OFFICER',
          action: 'RUN_DUPLICATE_SCAN',
          entityType: 'LandRecord',
          entityId: recordId,
          snapshotDiffJson: JSON.stringify({
            candidatesDetected: comparisons.length,
            comparisons: comparisons.map((c) => ({
              conflictingId: c.conflictingRecordId,
              score: c.compositeScore,
              reasons: c.matchReasons,
            })),
          }),
        },
      });
    }

    return {
      scannedRecordId: recordId,
      totalEvaluated: comparisons.length,
      candidatesFound: candidates.length,
      candidates,
    };
  }

  /**
   * Run duplicate detection scan across all active records
   */
  static async scanAllRecords(
    locationId?: string,
    officerId?: string
  ): Promise<DuplicateScanResultDTO> {
    const comparisons = await DuplicateDetectorService.scanAllRecords(locationId);
    const candidates = await this.listConflicts();

    if (officerId) {
      await prisma.auditLog.create({
        data: {
          actorId: officerId,
          actorRole: 'REVENUE_OFFICER',
          action: 'RUN_GLOBAL_DUPLICATE_SCAN',
          entityType: 'System',
          entityId: locationId || 'GLOBAL',
          snapshotDiffJson: JSON.stringify({
            totalDetected: comparisons.length,
          }),
        },
      });
    }

    return {
      totalEvaluated: comparisons.length,
      candidatesFound: candidates.length,
      candidates,
    };
  }

  /**
   * Helper to map Prisma entity to DuplicateCandidateDTO with similarity breakdown
   */
  static mapToDTO(c: any): DuplicateCandidateDTO {
    let scoreBreakdown = null;

    if (c.primaryRecord && c.conflictingRecord) {
      const comparison = DuplicateDetectorService.compareRecords(
        c.primaryRecord,
        c.conflictingRecord
      );
      scoreBreakdown = comparison.scoreBreakdown;
    }

    return {
      id: c.id,
      primaryRecordId: c.primaryRecordId,
      conflictingRecordId: c.conflictingRecordId || undefined,
      conflictType: c.conflictType as ConflictType,
      overlapPercentage: c.overlapPercentage || (scoreBreakdown ? scoreBreakdown.compositeScore : undefined),
      overlapAreaSqM: c.overlapAreaSqM || undefined,
      status: c.status as ConflictStatus,
      resolutionNotes: c.resolutionNotes || undefined,
      resolvedById: c.resolvedById || undefined,
      resolvedAt: c.resolvedAt ? c.resolvedAt.toISOString() : undefined,
      scoreBreakdown,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      primaryRecord: c.primaryRecord
        ? {
            id: c.primaryRecord.id,
            ulpin: c.primaryRecord.ulpin,
            khasraNumber: c.primaryRecord.khasraNumber,
            khatauniNumber: c.primaryRecord.khatauniNumber,
            locationId: c.primaryRecord.locationId,
            areaInSqMeters: c.primaryRecord.areaInSqMeters,
            areaUnit: c.primaryRecord.areaUnit,
            landType: c.primaryRecord.landType,
            status: c.primaryRecord.status,
            createdById: c.primaryRecord.createdById,
            createdAt: c.primaryRecord.createdAt.toISOString(),
            updatedAt: c.primaryRecord.updatedAt.toISOString(),
            owners: c.primaryRecord.owners
              ? c.primaryRecord.owners.map((o: any) => ({
                  id: o.id,
                  landRecordId: o.landRecordId,
                  fullName: o.fullName,
                  identifierMasked: o.identifierMasked,
                  relationType: o.relationType,
                  guardianName: o.guardianName,
                  shareFraction: o.shareFraction,
                  isPrimary: o.isPrimary,
                  mobileNumber: o.mobileNumber,
                  address: o.address,
                  addedAt: o.addedAt ? o.addedAt.toISOString() : new Date().toISOString(),
                }))
              : [],
            location: c.primaryRecord.location
              ? {
                  id: c.primaryRecord.location.id,
                  state: c.primaryRecord.location.state,
                  district: c.primaryRecord.location.district,
                  tehsil: c.primaryRecord.location.tehsil,
                  subDivision: c.primaryRecord.location.subDivision || undefined,
                  village: c.primaryRecord.location.village,
                  censusCode: c.primaryRecord.location.censusCode || undefined,
                  pincode: c.primaryRecord.location.pincode || undefined,
                  createdAt: c.primaryRecord.location.createdAt.toISOString(),
                  updatedAt: c.primaryRecord.location.updatedAt.toISOString(),
                }
              : undefined,
          }
        : undefined,
      conflictingRecord: c.conflictingRecord
        ? {
            id: c.conflictingRecord.id,
            ulpin: c.conflictingRecord.ulpin,
            khasraNumber: c.conflictingRecord.khasraNumber,
            khatauniNumber: c.conflictingRecord.khatauniNumber,
            locationId: c.conflictingRecord.locationId,
            areaInSqMeters: c.conflictingRecord.areaInSqMeters,
            areaUnit: c.conflictingRecord.areaUnit,
            landType: c.conflictingRecord.landType,
            status: c.conflictingRecord.status,
            createdById: c.conflictingRecord.createdById,
            createdAt: c.conflictingRecord.createdAt.toISOString(),
            updatedAt: c.conflictingRecord.updatedAt.toISOString(),
            owners: c.conflictingRecord.owners
              ? c.conflictingRecord.owners.map((o: any) => ({
                  id: o.id,
                  landRecordId: o.landRecordId,
                  fullName: o.fullName,
                  identifierMasked: o.identifierMasked,
                  relationType: o.relationType,
                  guardianName: o.guardianName,
                  shareFraction: o.shareFraction,
                  isPrimary: o.isPrimary,
                  mobileNumber: o.mobileNumber,
                  address: o.address,
                  addedAt: o.addedAt ? o.addedAt.toISOString() : new Date().toISOString(),
                }))
              : [],
            location: c.conflictingRecord.location
              ? {
                  id: c.conflictingRecord.location.id,
                  state: c.conflictingRecord.location.state,
                  district: c.conflictingRecord.location.district,
                  tehsil: c.conflictingRecord.location.tehsil,
                  subDivision: c.conflictingRecord.location.subDivision || undefined,
                  village: c.conflictingRecord.location.village,
                  censusCode: c.conflictingRecord.location.censusCode || undefined,
                  pincode: c.conflictingRecord.location.pincode || undefined,
                  createdAt: c.conflictingRecord.location.createdAt.toISOString(),
                  updatedAt: c.conflictingRecord.location.updatedAt.toISOString(),
                }
              : undefined,
          }
        : undefined,
    };
  }
}
