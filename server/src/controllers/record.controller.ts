import { Request, Response, NextFunction } from 'express';
import { RecordService } from '../services/record.service';
import { sendSuccess } from '../utils/responseFormatter';
import { HTTP_STATUS } from '../constants';
import { BadRequestError } from '../utils/AppError';
import { prisma } from '../config/database';

export class RecordController {
  static async search(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        state,
        district,
        tehsil,
        village,
        owner,
        ownerName,
        khasraNumber,
        ulpin,
        status,
        landType,
        minArea,
        maxArea,
        sortBy,
        sortOrder,
        page,
        limit,
      } = req.query;

      const result = await RecordService.searchRecords({
        state: state as string,
        district: district as string,
        tehsil: tehsil as string,
        village: village as string,
        owner: (owner || ownerName) as string,
        khasraNumber: khasraNumber as string,
        ulpin: ulpin as string,
        status: status as any,
        landType: landType as any,
        minArea: minArea ? parseFloat(minArea as string) : undefined,
        maxArea: maxArea ? parseFloat(maxArea as string) : undefined,
        sortBy: sortBy as string,
        sortOrder: (sortOrder as 'asc' | 'desc') || 'desc',
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });

      return sendSuccess(res, result.records, 'Records retrieved successfully', HTTP_STATUS.OK, result.pagination);
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const record = await RecordService.getRecordById(id);
      return sendSuccess(res, record, 'Record details retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        ulpin,
        khasraNumber,
        khatauniNumber,
        locationId,
        district,
        tehsil,
        village,
        state,
        areaInSqMeters,
        areaUnit,
        landType,
        owners,
        parcel,
      } = req.body;

      let resolvedLocationId = locationId;

      if (!resolvedLocationId) {
        if (!district || !village) {
          throw new BadRequestError('Either locationId or district/village is required');
        }
        // Find or create location
        let loc = await prisma.location.findFirst({
          where: {
            district: district.trim(),
            tehsil: (tehsil || district).trim(),
            village: village.trim(),
          },
        });

        if (!loc) {
          loc = await prisma.location.create({
            data: {
              state: state || 'Rajasthan',
              district: district.trim(),
              tehsil: (tehsil || district).trim(),
              village: village.trim(),
            },
          });
        }
        resolvedLocationId = loc.id;
      }

      if (!ulpin || !khasraNumber || !khatauniNumber || !areaInSqMeters || !owners?.length) {
        throw new BadRequestError('Missing required land record fields');
      }

      const record = await RecordService.createRecord({
        ulpin,
        khasraNumber,
        khatauniNumber,
        locationId: resolvedLocationId,
        areaInSqMeters: parseFloat(String(areaInSqMeters)),
        areaUnit,
        landType,
        createdById: req.user!.id,
        owners,
        parcel,
      });

      return sendSuccess(res, record, 'Land record created successfully', HTTP_STATUS.CREATED);
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status, landType, areaInSqMeters, areaUnit, khatauniNumber, owners } = req.body;

      const updated = await RecordService.updateRecord(
        id,
        {
          status,
          landType,
          areaInSqMeters: areaInSqMeters ? parseFloat(String(areaInSqMeters)) : undefined,
          areaUnit,
          khatauniNumber,
          owners,
        },
        req.user!.id
      );

      return sendSuccess(res, updated, 'Land record updated successfully');
    } catch (err) {
      next(err);
    }
  }
}
