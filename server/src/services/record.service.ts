import { prisma } from '../config/database';
import { NotFoundError, ConflictError } from '../utils/AppError';
import { LandRecordDTO, RecordStatus, LandType, AreaUnit } from '@land-digitization/shared';

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

export class RecordService {
  static async searchRecords(filters: {
    district?: string;
    tehsil?: string;
    village?: string;
    khasraNumber?: string;
    ulpin?: string;
    status?: RecordStatus;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.khasraNumber) where.khasraNumber = { contains: filters.khasraNumber };
    if (filters.ulpin) where.ulpin = { contains: filters.ulpin };
    if (filters.status) where.status = filters.status;

    if (filters.district || filters.tehsil || filters.village) {
      where.location = {};
      if (filters.district) where.location.district = { contains: filters.district };
      if (filters.tehsil) where.location.tehsil = { contains: filters.tehsil };
      if (filters.village) where.location.village = { contains: filters.village };
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
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    return {
      records: records.map(this.mapToDTO),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
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

    return this.mapToDTO(record);
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
      location: record.location
        ? {
            id: record.location.id,
            state: record.location.state,
            district: record.location.district,
            tehsil: record.location.tehsil,
            subDivision: record.location.subDivision,
            village: record.location.village,
            censusCode: record.location.censusCode,
            pincode: record.location.pincode,
            createdAt: record.location.createdAt.toISOString(),
            updatedAt: record.location.updatedAt.toISOString(),
          }
        : undefined,
      areaInSqMeters: record.areaInSqMeters,
      areaUnit: record.areaUnit as AreaUnit,
      landType: record.landType as LandType,
      status: record.status as RecordStatus,
      createdById: record.createdById,
      owners: record.owners?.map((o: any) => ({
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
        addedAt: o.addedAt.toISOString(),
      })),
      parcel: record.parcel
        ? {
            id: record.parcel.id,
            landRecordId: record.parcel.landRecordId,
            geometryJson: parsedGeom,
            centroidLat: record.parcel.centroidLat,
            centroidLng: record.parcel.centroidLng,
            crsProjection: record.parcel.crsProjection,
            boundaryHash: record.parcel.boundaryHash,
            northBoundary: record.parcel.northBoundary,
            southBoundary: record.parcel.southBoundary,
            eastBoundary: record.parcel.eastBoundary,
            westBoundary: record.parcel.westBoundary,
            createdAt: record.parcel.createdAt.toISOString(),
            updatedAt: record.parcel.updatedAt.toISOString(),
          }
        : null,
      documents: record.documents,
      ownershipHistory: record.ownershipHistory?.map((h: any) => ({
        id: h.id,
        landRecordId: h.landRecordId,
        previousOwnerName: h.previousOwnerName,
        newOwnerName: h.newOwnerName,
        mutationType: h.mutationType,
        mutationOrderNumber: h.mutationOrderNumber,
        mutationDate: h.mutationDate.toISOString(),
        transferredShare: h.transferredShare,
        recordedById: h.recordedById,
        createdAt: h.createdAt.toISOString(),
      })),
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }
}
