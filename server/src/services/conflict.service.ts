import { prisma } from '../config/database';
import { NotFoundError } from '../utils/AppError';
import { DuplicateCandidateDTO, ConflictStatus, ConflictType } from '@land-digitization/shared';

export class ConflictService {
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
          include: { location: true },
        },
        conflictingRecord: {
          include: { location: true },
        },
        resolvedBy: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return candidates.map(c => this.mapToDTO(c));
  }

  static async getConflictById(id: string): Promise<DuplicateCandidateDTO> {
    const candidate = await prisma.duplicateCandidate.findUnique({
      where: { id },
      include: {
        primaryRecord: {
          include: { location: true, owners: true },
        },
        conflictingRecord: {
          include: { location: true, owners: true },
        },
        resolvedBy: true,
      },
    });

    if (!candidate) {
      throw new NotFoundError(`Duplicate candidate with ID ${id} not found`);
    }

    return this.mapToDTO(candidate);
  }

  static async resolveConflict(id: string, data: {
    status: ConflictStatus;
    resolutionNotes?: string;
    resolvedById: string;
  }): Promise<DuplicateCandidateDTO> {
    const candidate = await prisma.duplicateCandidate.findUnique({
      where: { id },
    });

    if (!candidate) {
      throw new NotFoundError(`Duplicate candidate with ID ${id} not found`);
    }

    const updated = await prisma.duplicateCandidate.update({
      where: { id },
      data: {
        status: data.status,
        resolutionNotes: data.resolutionNotes,
        resolvedById: data.resolvedById,
        resolvedAt: new Date(),
      },
      include: {
        primaryRecord: { include: { location: true } },
        conflictingRecord: { include: { location: true } },
        resolvedBy: true,
      },
    });

    return this.mapToDTO(updated);
  }

  static mapToDTO(c: any): DuplicateCandidateDTO {
    return {
      id: c.id,
      primaryRecordId: c.primaryRecordId,
      conflictingRecordId: c.conflictingRecordId || undefined,
      conflictType: c.conflictType as ConflictType,
      overlapPercentage: c.overlapPercentage || undefined,
      overlapAreaSqM: c.overlapAreaSqM || undefined,
      status: c.status as ConflictStatus,
      resolutionNotes: c.resolutionNotes || undefined,
      resolvedById: c.resolvedById || undefined,
      resolvedAt: c.resolvedAt ? c.resolvedAt.toISOString() : undefined,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      primaryRecord: c.primaryRecord ? {
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
        location: c.primaryRecord.location ? {
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
        } : undefined,
      } : undefined,
      conflictingRecord: c.conflictingRecord ? {
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
        location: c.conflictingRecord.location ? {
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
        } : undefined,
      } : undefined,
    };
  }
}
