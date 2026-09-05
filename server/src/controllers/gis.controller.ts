import { Request, Response, NextFunction } from 'express';
import { GisService } from '../services/gis.service.js';
import { sendSuccess } from '../utils/responseFormatter.js';
import { BadRequestError, NotFoundError } from '../utils/AppError.js';

export class GisController {
  static async getVillageParcels(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        district,
        tehsil,
        village,
        locationId,
        status,
        validationStatus,
        khasraNumber,
        search,
      } = req.query;

      const geojson = await GisService.getVillageParcelsGeoJSON({
        district: district as string,
        tehsil: tehsil as string,
        village: village as string,
        locationId: locationId as string,
        status: status as string,
        validationStatus: validationStatus as any,
        khasraNumber: khasraNumber as string,
        search: search as string,
      });

      return sendSuccess(res, geojson, 'Cadastral parcels GeoJSON retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async getParcelById(req: Request, res: Response, next: NextFunction) {
    try {
      const parcel = await GisService.getParcelById(req.params.id);
      if (!parcel) {
        throw new NotFoundError(`Parcel with ID ${req.params.id} not found`);
      }

      return sendSuccess(res, parcel, 'Parcel details retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async computeGeometry(req: Request, res: Response, next: NextFunction) {
    try {
      const { geometryJson } = req.body;
      if (!geometryJson) {
        throw new BadRequestError('geometryJson is required');
      }

      const result = await GisService.computeCentroidAndArea(geometryJson);
      return sendSuccess(res, result, 'Centroid and area computed');
    } catch (err) {
      next(err);
    }
  }
}
