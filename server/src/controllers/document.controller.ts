import { Request, Response, NextFunction } from 'express';
import { DocumentService } from '../services/document.service';
import { sendSuccess } from '../utils/responseFormatter';
import { HTTP_STATUS } from '../constants';
import { BadRequestError } from '../utils/AppError';

export class DocumentController {
  static async upload(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new BadRequestError('No document file was uploaded. Please attach a valid PDF or image file.');
      }

      const { landRecordId, requestId, documentType } = req.body;

      const doc = await DocumentService.registerUpload(req.file, {
        landRecordId,
        requestId,
        documentType,
        uploadedById: req.user!.id,
      });

      return sendSuccess(res, doc, 'Document uploaded and cryptographic checksum verified', HTTP_STATUS.CREATED);
    } catch (err) {
      next(err);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { landRecordId, requestId, uploadedById, documentType } = req.query;
      const docs = await DocumentService.listDocuments(
        {
          landRecordId: landRecordId as string,
          requestId: requestId as string,
          uploadedById: uploadedById as string,
          documentType: documentType as any,
        },
        req.user
      );

      return sendSuccess(res, docs, 'Documents retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const doc = await DocumentService.getDocumentById(id, req.user);
      return sendSuccess(res, doc, 'Document metadata retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async viewFile(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { stream, fileName, fileType, fileSize, fileHash } = await DocumentService.getDocumentStream(id, req.user);

      res.setHeader('Content-Type', fileType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileName)}"`);
      res.setHeader('Content-Length', fileSize);
      res.setHeader('X-Document-SHA256', fileHash);

      stream.pipe(res);
    } catch (err) {
      next(err);
    }
  }

  static async downloadFile(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { stream, fileName, fileType, fileSize, fileHash } = await DocumentService.getDocumentStream(id, req.user);

      res.setHeader('Content-Type', fileType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
      res.setHeader('Content-Length', fileSize);
      res.setHeader('X-Document-SHA256', fileHash);

      stream.pipe(res);
    } catch (err) {
      next(err);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await DocumentService.deleteDocument(id, req.user!);
      return sendSuccess(res, result, 'Document deleted successfully');
    } catch (err) {
      next(err);
    }
  }
}
