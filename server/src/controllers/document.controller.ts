import { Request, Response, NextFunction } from 'express';
import { DocumentService } from '../services/document.service';
import { sendSuccess } from '../utils/responseFormatter';
import { HTTP_STATUS } from '../constants';
import { BadRequestError } from '../utils/AppError';
import path from 'path';
import fs from 'fs';

export class DocumentController {
  static async upload(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new BadRequestError('No document file was uploaded');
      }

      const { recordId, workflowId, documentType } = req.body;

      const doc = await DocumentService.registerUpload(req.file, {
        recordId,
        workflowId,
        documentType,
        uploadedById: req.user!.id,
      });

      return sendSuccess(res, doc, 'Document uploaded and checksum verified', HTTP_STATUS.CREATED);
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const doc = await DocumentService.getDocumentById(id);
      return sendSuccess(res, doc, 'Document metadata retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async downloadFile(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const doc = await DocumentService.getDocumentById(id);

      if (!fs.existsSync(doc.filePath)) {
        throw new BadRequestError('Physical document file is not found on disk');
      }

      return res.download(path.resolve(doc.filePath), doc.fileName);
    } catch (err) {
      next(err);
    }
  }
}
