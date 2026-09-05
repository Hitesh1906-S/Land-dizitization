import { prisma } from '../config/database';
import { NotFoundError, ConflictError } from '../utils/AppError';
import { LandRecordDTO, RecordStatus, LandType, AreaUnit } from '@land-digitization/shared';

export interface CreateLandRecordInput {
  ulpin: string;
  khasraNumber: string;
  khatauniNumber: string;
  district: string;
  tehsil: string;
  village: string;
  areaInSqMeters: number;
  areaUnit?: AreaUnit;
  landType?: LandType;
  createdById: string;
  owners?: {
    ownerName: string;
    identifierMasked?: string;
    relationType?: string;
    shareFraction?: number;
    isPrimary?: boolean;
  }[];
  geometry?: {
    geometryJson: any;
    centroidLat: number;
    centroidLng: number;
    crsProjection?: string;
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
    if (filters.district) where.district = { contains: filters.district, mode: 'insensitive' };
    if (filters.tehsil) where.tehsil = { contains: filters.tehsil, mode: 'insensitive' };
    if (filters.village) where.village = { contains: filters.village, mode: 'insensitive' };
    if (filters.khasraNumber) where.khasraNumber = { contains: filters.khasraNumber, mode: 'insensitive' };
    if (filters.ulpin) where.ulpin = { contains: filters.ulpin, mode: 'insensitive' };
    if (filters.status) where.status = filters.status;

    const [total, records] = await Promise.all([
      prisma.landRecord.count({ where }),
      prisma.landRecord.findMany({
        where,
        skip,
        take: limit,
        include: {
          owners: true,
          geometry: true,
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
        owners: true,
        geometry: true,
        documents: true,
        conflictsAsA: true,
        conflictsAsB: true,
        validationReports: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!record) {
      throw new NotFoundError(`Land record with ID ${id} not found`);
    }

    return this.mapToDTO(record);
  }

  static async createRecord(data: CreateLandRecordInput) {
    // Check duplicate khasra in same village
    const existing = await prisma.landRecord.findFirst({
      where: {
        district: data.district,
        tehsil: data.tehsil,
        village: data.village,
        khasraNumber: data.khasraNumber,
      },
    });

    if (existing) {
      throw new ConflictError(
        `A land record already exists with Khasra No ${data.khasraNumber} in village ${data.village}`
      );
    }

    const record = await prisma.landRecord.create({
      data: {
        ulpin: data.ulpin,
        khasraNumber: data.khasraNumber,
        khatauniNumber: data.khatauniNumber,
        district: data.district,
        tehsil: data.tehsil,
        village: data.village,
        areaInSqMeters: data.areaInSqMeters,
        areaUnit: data.areaUnit || AreaUnit.SQ_METERS,
        landType: data.landType || LandType.AGRICULTURAL,
        status: RecordStatus.PENDING_VERIFICATION,
        createdById: data.createdById,
        owners: data.owners
          ? {
              create: data.owners.map((o) => ({
                ownerName: o.ownerName,
                identifierMasked: o.identifierMasked,
                relationType: o.relationType,
                shareFraction: o.shareFraction ?? 1.0,
                isPrimary: o.isPrimary ?? true,
              })),
            }
          : undefined,
        geometry: data.geometry
          ? {
              create: {
                geometryJson: typeof data.geometry.geometryJson === 'string'
                  ? data.geometry.geometryJson
                  : JSON.stringify(data.geometry.geometryJson),
                centroidLat: data.geometry.centroidLat,
                centroidLng: data.geometry.centroidLng,
                crsProjection: data.geometry.crsProjection || 'EPSG:4326',
              },
            }
          : undefined,
      },
      include: {
        owners: true,
        geometry: true,
      },
    });

    return this.mapToDTO(record);
  }

  static mapToDTO(record: any): LandRecordDTO {
    let parsedGeom: any = null;
    if (record.geometry?.geometryJson) {
      parsedGeom = typeof record.geometry.geometryJson === 'string'
        ? JSON.parse(record.geometry.geometryJson)
        : record.geometry.geometryJson;
    }

    return {
      id: record.id,
      ulpin: record.ulpin,
      khasraNumber: record.khasraNumber,
      khatauniNumber: record.khatauniNumber,
      district: record.district,
      tehsil: record.tehsil,
      village: record.village,
      areaInSqMeters: record.areaInSqMeters,
      areaUnit: record.areaUnit as AreaUnit,
      landType: record.landType as LandType,
      status: record.status as RecordStatus,
      owners: record.owners?.map((o: any) => ({
        id: o.id,
        recordId: o.recordId,
        ownerName: o.ownerName,
        identifierMasked: o.identifierMasked,
        relationType: o.relationType,
        shareFraction: o.shareFraction,
        isPrimary: o.isPrimary,
      })),
      geometry: record.geometry
        ? {
            id: record.geometry.id,
            recordId: record.geometry.recordId,
            geometryJson: parsedGeom,
            centroidLat: record.geometry.centroidLat,
            centroidLng: record.geometry.centroidLng,
            crsProjection: record.geometry.crsProjection,
            boundaryHash: record.geometry.boundaryHash,
          }
        : null,
      documents: record.documents,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }
}
