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

      const job = await OcrService.startExtractionJob(documentId, engine);
      return sendSuccess(res, job, 'OCR extraction job scheduled', HTTP_STATUS.ACCEPTED);
    } catch (err) {
      next(err);
    }
  }

  static async getJobStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { jobId } = req.params;
      const job = await OcrService.getJobStatus(jobId);
      return sendSuccess(res, job, 'Job status retrieved');
    } catch (err) {
      next(err);
    }
  }
}
