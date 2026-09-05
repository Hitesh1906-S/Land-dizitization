import { Request, Response, NextFunction } from 'express';
import { OcrService } from '../services/ocr/ocr.adapter';
import { sendSuccess } from '../utils/responseFormatter';
import { HTTP_STATUS } from '../constants';
import { BadRequestError } from '../utils/AppError';

export class OcrController {
  static async startJob(req: Request, res: Response, next: NextFunction) {
    try {
      const { documentId, engine } = req.body;
      if (!documentId) {
        throw new BadRequestError('documentId is required');
      }

      const result = await OcrService.startExtractionJob(documentId, engine);
      return sendSuccess(res, result, 'OCR extraction processed successfully', HTTP_STATUS.ACCEPTED);
    } catch (err) {
      next(err);
    }
  }

  static async getResultByDocumentId(req: Request, res: Response, next: NextFunction) {
    try {
      const { documentId } = req.params;
      const result = await OcrService.getResultByDocumentId(documentId);
      return sendSuccess(res, result, 'OCR extraction result retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async verifyField(req: Request, res: Response, next: NextFunction) {
    try {
      const { fieldId } = req.params;
      const { verifiedValue } = req.body;
      const userId = req.user?.id || 'admin-user-id';

      const field = await OcrService.verifyField(fieldId, verifiedValue, userId);
      return sendSuccess(res, field, 'Extracted field verified successfully');
    } catch (err) {
      next(err);
    }
  }
}
