import { Request, Response, NextFunction } from 'express';
import { OcrService } from '../services/ocr/ocr.adapter.js';
import { sendSuccess } from '../utils/responseFormatter.js';
import { HTTP_STATUS } from '../constants/index.js';
import { BadRequestError } from '../utils/AppError.js';

export class OcrController {
  static async startJob(req: Request, res: Response, next: NextFunction) {
    try {
      const { documentId, engine, preprocessingOptions } = req.body;
      if (!documentId) {
        throw new BadRequestError('documentId is required');
      }

      const result = await OcrService.startExtractionJob(documentId, engine, preprocessingOptions);
      return sendSuccess(res, result, 'OCR extraction and field parsing completed successfully', HTTP_STATUS.ACCEPTED);
    } catch (err) {
      next(err);
    }
  }

  static async extractFieldsFromText(req: Request, res: Response, next: NextFunction) {
    try {
      const { rawOcrText, provider } = req.body;
      if (!rawOcrText) {
        throw new BadRequestError('rawOcrText is required');
      }

      const result = await OcrService.extractStructuredFields(rawOcrText, provider);
      return sendSuccess(res, result, 'Structured land record fields extracted successfully');
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

  static async approveField(req: Request, res: Response, next: NextFunction) {
    try {
      const { fieldId } = req.params;
      const userId = req.user?.id || 'admin-user-id';

      const field = await OcrService.approveField(fieldId, userId);
      return sendSuccess(res, field, 'Extracted field approved successfully');
    } catch (err) {
      next(err);
    }
  }

  static async correctField(req: Request, res: Response, next: NextFunction) {
    try {
      const { fieldId } = req.params;
      const { correctedValue, reason } = req.body;
      const userId = req.user?.id || 'admin-user-id';

      const field = await OcrService.correctField(fieldId, correctedValue, userId, reason);
      return sendSuccess(res, field, 'Extracted field corrected and approved');
    } catch (err) {
      next(err);
    }
  }

  static async rejectField(req: Request, res: Response, next: NextFunction) {
    try {
      const { fieldId } = req.params;
      const { reason } = req.body;
      const userId = req.user?.id || 'admin-user-id';

      const field = await OcrService.rejectField(fieldId, reason, userId);
      return sendSuccess(res, field, 'Extracted field rejected');
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

  static async batchVerifyFields(req: Request, res: Response, next: NextFunction) {
    try {
      const { documentId } = req.params;
      const { verifications } = req.body;
      const userId = req.user?.id || 'admin-user-id';

      if (!verifications || !Array.isArray(verifications)) {
        throw new BadRequestError('verifications array is required');
      }

      const result = await OcrService.batchVerifyFields(documentId, verifications, userId);
      return sendSuccess(res, result, 'All extracted fields verified successfully');
    } catch (err) {
      next(err);
    }
  }

  static async approveCompleteRecord(req: Request, res: Response, next: NextFunction) {
    try {
      const { documentId } = req.params;
      const { notes } = req.body;
      const userId = req.user?.id || 'admin-user-id';

      const result = await OcrService.approveCompleteRecord(documentId, userId, notes);
      return sendSuccess(res, result, 'Complete land record approved, sanctioned and digitized successfully');
    } catch (err) {
      next(err);
    }
  }

  static async sendBackForCorrection(req: Request, res: Response, next: NextFunction) {
    try {
      const { documentId } = req.params;
      const { reason, requiredDocuments } = req.body;
      const userId = req.user?.id || 'admin-user-id';

      const result = await OcrService.sendBackForCorrection(documentId, reason, userId, requiredDocuments);
      return sendSuccess(res, result, 'Document sent back to citizen for correction');
    } catch (err) {
      next(err);
    }
  }
}
