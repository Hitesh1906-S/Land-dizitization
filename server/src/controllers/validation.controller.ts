import { Request, Response, NextFunction } from 'express';
import { ValidationEngine } from '../services/validation/validation.engine';
import { sendSuccess } from '../utils/responseFormatter';
import { BadRequestError } from '../utils/AppError';

export class ValidationController {
  static async validateRecord(req: Request, res: Response, next: NextFunction) {
    try {
      const { recordId } = req.body;
      if (!recordId) {
        throw new BadRequestError('recordId is required for validation');
      }

      const report = await ValidationEngine.validateRecord(recordId);
      return sendSuccess(res, report, 'Validation rules executed successfully');
    } catch (err) {
      next(err);
    }
  }
}
