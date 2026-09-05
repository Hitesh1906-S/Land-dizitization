import { Request, Response, NextFunction } from 'express';
import { LocationService } from '../services/location.service';
import { sendSuccess } from '../utils/responseFormatter';
import { HTTP_STATUS } from '../constants';

export class LocationController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const locations = await LocationService.getAllLocations();
      return sendSuccess(res, locations, 'Locations retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const location = await LocationService.getLocationById(id);
      return sendSuccess(res, location, 'Location retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const location = await LocationService.createLocation(req.body);
      return sendSuccess(res, location, 'Location created successfully', HTTP_STATUS.CREATED);
    } catch (err) {
      next(err);
    }
  }
}
