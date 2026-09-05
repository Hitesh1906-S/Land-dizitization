import { Request, Response, NextFunction } from 'express';
import { GisService } from '../services/gis.service';
import { sendSuccess } from '../utils/responseFormatter';
import { BadRequestError } from '../utils/AppError';

export class GisController {
  static async getVillageParcels(req: Request, res: Response, next: NextFunction) {
    try {
      const { district, tehsil, village } = req.query;

      const geojson = await GisService.getVillageParcelsGeoJSON({
        district: district as string,
        tehsil: tehsil as string,
        village: village as string,
      });

      return sendSuccess(res, geojson, 'Cadastral parcels GeoJSON retrieved');
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
