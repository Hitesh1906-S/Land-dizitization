import { Request, Response, NextFunction } from 'express';
import { ValidationEngine } from '../services/validation/validation.engine';
import { sendSuccess } from '../utils/responseFormatter';
import { BadRequestError } from '../utils/AppError';

export class ValidationController {
  static async validateRecord(req: Request, res: Response, next: NextFunction) {
    try {
      const { landRecordId } = req.body;
      if (!landRecordId) {
        throw new BadRequestError('landRecordId is required for validation');
      }

      const userId = req.user?.id;
      const report = await ValidationEngine.validateRecord(landRecordId, userId);
      return sendSuccess(res, report, 'Validation rules executed successfully');
    } catch (err) {
      next(err);
    }
  }

  static async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { landRecordId } = req.params;
      const history = await ValidationEngine.getValidationHistory(landRecordId);
      return sendSuccess(res, history, 'Validation history retrieved');
    } catch (err) {
      next(err);
    }
  }
}
