import { prisma } from '../config/database';
import { NotFoundError, ConflictError } from '../utils/AppError';
import { LandRecordDTO, RecordStatus, LandType, AreaUnit, AuditAction } from '@land-digitization/shared';

export interface CreateLandRecordInput {
  ulpin: string;
  khasraNumber: string;
  khatauniNumber: string;
  locationId: string;
  areaInSqMeters: number;
  areaUnit?: AreaUnit;
  landType?: LandType;
  createdById: string;
  owners: {
    fullName: string;
    relationType?: string;
    guardianName?: string;
    identifierMasked?: string;
    shareFraction?: number;
    isPrimary?: boolean;
    mobileNumber?: string;
    address?: string;
  }[];
  parcel?: {
    geometryJson: any;
    centroidLat: number;
    centroidLng: number;
    crsProjection?: string;
    northBoundary?: string;
    southBoundary?: string;
    eastBoundary?: string;
    westBoundary?: string;
  };
}

export interface UpdateLandRecordInput {
  status?: RecordStatus;
  landType?: LandType;
  areaInSqMeters?: number;
  areaUnit?: AreaUnit;
  khatauniNumber?: string;
  owners?: {
    id?: string;
    fullName: string;
    relationType?: string;
    guardianName?: string;
    identifierMasked?: string;
    shareFraction?: number;
    isPrimary?: boolean;
    mobileNumber?: string;
    address?: string;
  }[];
}

export class RecordService {
  static async searchRecords(filters: {
    state?: string;
    district?: string;
    tehsil?: string;
    village?: string;
    owner?: string;
    ownerName?: string;
    khasraNumber?: string;
    ulpin?: string;
    status?: RecordStatus;
    landType?: LandType;
    minArea?: number;
    maxArea?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.khasraNumber) {
      where.khasraNumber = { contains: filters.khasraNumber.trim() };
    }
    if (filters.ulpin) {
      where.ulpin = { contains: filters.ulpin.trim() };
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.landType) {
      where.landType = filters.landType;
    }

    if (filters.minArea !== undefined || filters.maxArea !== undefined) {
      where.areaInSqMeters = {};
      if (filters.minArea !== undefined) where.areaInSqMeters.gte = filters.minArea;
      if (filters.maxArea !== undefined) where.areaInSqMeters.lte = filters.maxArea;
    }

    // Owner name filter across owners relation
    const ownerQuery = filters.owner || filters.ownerName;
    if (ownerQuery) {
      where.owners = {
        some: {
          fullName: { contains: ownerQuery.trim() },
        },
      };
    }

    // Location hierarchy filters
    if (filters.state || filters.district || filters.tehsil || filters.village) {
      where.location = {};
      if (filters.state) where.location.state = { contains: filters.state.trim() };
      if (filters.district) where.location.district = { contains: filters.district.trim() };
      if (filters.tehsil) where.location.tehsil = { contains: filters.tehsil.trim() };
      if (filters.village) where.location.village = { contains: filters.village.trim() };
    }

    // Sorting
    const sortField = filters.sortBy || 'updatedAt';
    const sortDirection = filters.sortOrder === 'asc' ? 'asc' : 'desc';
    const orderBy: any = {};

    if (['createdAt', 'updatedAt', 'areaInSqMeters', 'khasraNumber'].includes(sortField)) {
      orderBy[sortField] = sortDirection;
    } else {
      orderBy.updatedAt = 'desc';
    }

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
        },
        orderBy,
      }),
    ]);

    return {
      records: records.map(this.mapToDTO),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  static async getRecordById(id: string) {
    const record = await prisma.landRecord.findUnique({
      where: { id },
      include: {
        location: true,
        owners: true,
        parcel: true,
        documents: {
          include: { ocrResult: true },
        },
        ownershipHistory: {
          orderBy: { mutationDate: 'desc' },
        },
        validationResults: {
          include: { issues: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        primaryConflicts: true,
        conflictingDuplicates: true,
      },
    });

    if (!record) {
      throw new NotFoundError(`Land record with ID ${id} not found`);
    }

    return this.mapToDTO(record);
  }

  static async createRecord(data: CreateLandRecordInput) {
    // Check duplicate ULPIN
    const existingUlpin = await prisma.landRecord.findUnique({
      where: { ulpin: data.ulpin },
    });
    if (existingUlpin) {
      throw new ConflictError(`A land record already exists with ULPIN ${data.ulpin}`);
    }

    // Check duplicate khasra within same location
    const existingKhasra = await prisma.landRecord.findUnique({
      where: {
        locationId_khasraNumber: {
          locationId: data.locationId,
          khasraNumber: data.khasraNumber,
        },
      },
    });

    if (existingKhasra) {
      throw new ConflictError(`Khasra ${data.khasraNumber} is already registered at this location`);
    }

    const record = await prisma.landRecord.create({
      data: {
        ulpin: data.ulpin,
        khasraNumber: data.khasraNumber,
        khatauniNumber: data.khatauniNumber,
        locationId: data.locationId,
        areaInSqMeters: data.areaInSqMeters,
        areaUnit: data.areaUnit || AreaUnit.SQ_METERS,
        landType: data.landType || LandType.AGRICULTURAL,
        status: RecordStatus.PENDING_VERIFICATION,
        createdById: data.createdById,
        owners: {
          create: data.owners.map((o) => ({
            fullName: o.fullName,
            identifierMasked: o.identifierMasked,
            relationType: o.relationType,
            guardianName: o.guardianName,
            shareFraction: o.shareFraction ?? 1.0,
            isPrimary: o.isPrimary ?? true,
            mobileNumber: o.mobileNumber,
            address: o.address,
          })),
        },
        parcel: data.parcel
          ? {
              create: {
                geometryJson:
                  typeof data.parcel.geometryJson === 'string'
                    ? data.parcel.geometryJson
                    : JSON.stringify(data.parcel.geometryJson),
                centroidLat: data.parcel.centroidLat,
                centroidLng: data.parcel.centroidLng,
                crsProjection: data.parcel.crsProjection || 'EPSG:4326',
                northBoundary: data.parcel.northBoundary,
                southBoundary: data.parcel.southBoundary,
                eastBoundary: data.parcel.eastBoundary,
                westBoundary: data.parcel.westBoundary,
              },
            }
          : undefined,
      },
      include: {
        location: true,
        owners: true,
        parcel: true,
      },
    });

    // Record Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          actorId: data.createdById,
          actorRole: 'OFFICER',
          action: AuditAction.CREATE,
          entityType: 'LandRecord',
          entityId: record.id,
          snapshotDiffJson: JSON.stringify({ ulpin: record.ulpin, khasra: record.khasraNumber }),
        },
      });
    } catch {
      // Non-blocking
    }

    return this.mapToDTO(record);
  }

  static async updateRecord(id: string, data: UpdateLandRecordInput, updatedById: string) {
    const existing = await prisma.landRecord.findUnique({
      where: { id },
      include: { owners: true },
    });

    if (!existing) {
      throw new NotFoundError(`Land record with ID ${id} not found`);
    }

    const updated = await prisma.landRecord.update({
      where: { id },
      data: {
        status: data.status,
        landType: data.landType,
        areaInSqMeters: data.areaInSqMeters,
        areaUnit: data.areaUnit,
        khatauniNumber: data.khatauniNumber,
      },
      include: {
        location: true,
        owners: true,
        parcel: true,
      },
    });

    // Update owners if provided
    if (data.owners && data.owners.length > 0) {
      await prisma.owner.deleteMany({ where: { landRecordId: id } });
      await prisma.owner.createMany({
        data: data.owners.map((o) => ({
          landRecordId: id,
          fullName: o.fullName,
          identifierMasked: o.identifierMasked,
          relationType: o.relationType,
          guardianName: o.guardianName,
          shareFraction: o.shareFraction ?? 1.0,
          isPrimary: o.isPrimary ?? true,
          mobileNumber: o.mobileNumber,
          address: o.address,
        })),
      });
    }

    // Record Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          actorId: updatedById,
          actorRole: 'OFFICER',
          action: AuditAction.UPDATE,
          entityType: 'LandRecord',
          entityId: id,
          snapshotDiffJson: JSON.stringify({
            previousStatus: existing.status,
            newStatus: data.status || existing.status,
            updatedFields: Object.keys(data),
          }),
        },
      });
    } catch {
      // Non-blocking
    }

    return this.getRecordById(id);
  }

  static mapToDTO(record: any): LandRecordDTO {
    let parsedGeom: any = null;
    if (record.parcel?.geometryJson) {
      parsedGeom =
        typeof record.parcel.geometryJson === 'string'
          ? JSON.parse(record.parcel.geometryJson)
          : record.parcel.geometryJson;
    }

    return {
      id: record.id,
      ulpin: record.ulpin,
      khasraNumber: record.khasraNumber,
      khatauniNumber: record.khatauniNumber,
      locationId: record.locationId,
      areaInSqMeters: record.areaInSqMeters,
      areaUnit: record.areaUnit as AreaUnit,
      landType: record.landType as LandType,
      status: record.status as RecordStatus,
      createdById: record.createdById,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
      location: record.location
        ? {
            id: record.location.id,
            state: record.location.state,
            district: record.location.district,
            tehsil: record.location.tehsil,
            subDivision: record.location.subDivision || undefined,
            village: record.location.village,
            censusCode: record.location.censusCode || undefined,
            pincode: record.location.pincode || undefined,
            createdAt: record.location.createdAt.toISOString(),
            updatedAt: record.location.updatedAt.toISOString(),
          }
        : undefined,
      owners: record.owners
        ? record.owners.map((o: any) => ({
            id: o.id,
            landRecordId: o.landRecordId,
            fullName: o.fullName,
            identifierMasked: o.identifierMasked || undefined,
            relationType: o.relationType || undefined,
            guardianName: o.guardianName || undefined,
            shareFraction: o.shareFraction,
            isPrimary: o.isPrimary,
            mobileNumber: o.mobileNumber || undefined,
            address: o.address || undefined,
            addedAt: o.addedAt.toISOString(),
          }))
        : [],
      parcel: record.parcel
        ? {
            id: record.parcel.id,
            landRecordId: record.parcel.landRecordId,
            geometryJson: parsedGeom,
            centroidLat: record.parcel.centroidLat,
            centroidLng: record.parcel.centroidLng,
            crsProjection: record.parcel.crsProjection,
            boundaryHash: record.parcel.boundaryHash || undefined,
            northBoundary: record.parcel.northBoundary || undefined,
            southBoundary: record.parcel.southBoundary || undefined,
            eastBoundary: record.parcel.eastBoundary || undefined,
            westBoundary: record.parcel.westBoundary || undefined,
            createdAt: record.parcel.createdAt.toISOString(),
            updatedAt: record.parcel.updatedAt.toISOString(),
          }
        : null,
      documents: record.documents
        ? record.documents.map((d: any) => ({
            id: d.id,
            landRecordId: d.landRecordId,
            requestId: d.requestId || undefined,
            fileName: d.fileName,
            fileType: d.fileType,
            filePath: d.filePath,
            fileSize: d.fileSize,
            fileHash: d.fileHash,
            documentType: d.documentType as any,
            uploadedById: d.uploadedById,
            createdAt: d.createdAt.toISOString(),
            ocrResult: d.ocrResult
              ? {
                  id: d.ocrResult.id,
                  documentId: d.ocrResult.documentId,
                  status: d.ocrResult.status,
                  rawText: d.ocrResult.rawText || undefined,
                  confidenceScore: d.ocrResult.confidenceScore || undefined,
                  engine: d.ocrResult.engine,
                  pageCount: d.ocrResult.pageCount,
                  processingTimeMs: d.ocrResult.processingTimeMs || undefined,
                  completedAt: d.ocrResult.completedAt
                    ? d.ocrResult.completedAt.toISOString()
                    : undefined,
                  createdAt: d.ocrResult.createdAt.toISOString(),
                }
              : undefined,
          }))
        : [],
      ownershipHistory: record.ownershipHistory
        ? record.ownershipHistory.map((h: any) => ({
            id: h.id,
            landRecordId: h.landRecordId,
            previousOwnerName: h.previousOwnerName,
            newOwnerName: h.newOwnerName,
            mutationType: h.mutationType as any,
            mutationOrderNumber: h.mutationOrderNumber,
            mutationDate: h.mutationDate.toISOString(),
            transferredShare: h.transferredShare,
            recordedById: h.recordedById,
            createdAt: h.createdAt.toISOString(),
          }))
        : [],
    };
  }
}
