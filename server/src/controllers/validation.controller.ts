import { Request, Response, NextFunction } from 'express';
import { ValidationEngine } from '../services/validation/validation.engine.js';
import { sendSuccess } from '../utils/responseFormatter.js';
import { BadRequestError } from '../utils/AppError.js';

export class ValidationController {
  static async validateRecord(req: Request, res: Response, next: NextFunction) {
    try {
      const landRecordId = req.body?.landRecordId || req.params?.landRecordId;
      if (!landRecordId) {
        throw new BadRequestError('landRecordId is required for validation');
      }

      const userId = req.user?.id || 'officer-id';
      const report = await ValidationEngine.validateRecord(landRecordId, userId);
      return sendSuccess(res, report, 'Deterministic validation rules executed successfully');
    } catch (err) {
      next(err);
    }
  }

  static async getLatestValidation(req: Request, res: Response, next: NextFunction) {
    try {
      const { landRecordId } = req.params;
      const report = await ValidationEngine.getLatestValidation(landRecordId);
      return sendSuccess(res, report, 'Latest validation report retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async resolveIssue(req: Request, res: Response, next: NextFunction) {
    try {
      const { issueId } = req.params;
      const { resolutionNotes } = req.body;
      const userId = req.user?.id || 'officer-id';

      const result = await ValidationEngine.resolveIssue(issueId, userId, resolutionNotes);
      return sendSuccess(res, result, 'Validation issue marked as resolved');
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
