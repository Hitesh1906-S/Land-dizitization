import { Request, Response, NextFunction } from 'express';
import { RecordService } from '../services/record.service';
import { sendSuccess } from '../utils/responseFormatter';
import { HTTP_STATUS } from '../constants';
import { BadRequestError } from '../utils/AppError';

export class RecordController {
  static async search(req: Request, res: Response, next: NextFunction) {
    try {
      const { district, tehsil, village, khasraNumber, ulpin, status, page, limit } = req.query;

      const result = await RecordService.searchRecords({
        district: district as string,
        tehsil: tehsil as string,
        village: village as string,
        khasraNumber: khasraNumber as string,
        ulpin: ulpin as string,
        status: status as any,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });

      return sendSuccess(res, result.records, 'Records retrieved', HTTP_STATUS.OK, result.pagination);
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
      const { ulpin, khasraNumber, khatauniNumber, district, tehsil, village, areaInSqMeters, areaUnit, landType, owners, geometry } = req.body;

      if (!ulpin || !khasraNumber || !khatauniNumber || !district || !village || !areaInSqMeters) {
        throw new BadRequestError('Missing required land record fields');
      }

      const record = await RecordService.createRecord({
        ulpin,
        khasraNumber,
        khatauniNumber,
        district,
        tehsil: tehsil || district,
        village,
        areaInSqMeters: parseFloat(areaInSqMeters),
        areaUnit,
        landType,
        createdById: req.user!.id,
        owners,
        geometry,
      });

      return sendSuccess(res, record, 'Land record created successfully', HTTP_STATUS.CREATED);
    } catch (err) {
      next(err);
    }
  }
}
