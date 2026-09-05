import { prisma } from '../config/database';
import { calculateFileHash } from '../utils/hash';
import { NotFoundError } from '../utils/AppError';
import { DocumentDTO, DocumentType } from '@land-digitization/shared';

export class DocumentService {
  static async registerUpload(file: Express.Multer.File, data: {
    recordId?: string;
    workflowId?: string;
    documentType?: DocumentType;
    uploadedById: string;
  }) {
    const fileHash = await calculateFileHash(file.path);

    const document = await prisma.document.create({
      data: {
        recordId: data.recordId,
        workflowId: data.workflowId,
        fileName: file.originalname,
        fileType: file.mimetype,
        filePath: file.path,
        fileSize: file.size,
        fileHash,
        documentType: data.documentType || DocumentType.REGISTRATION_DEED,
        uploadedById: data.uploadedById,
      },
    });

    return this.mapToDTO(document);
  }

  static async getDocumentById(id: string) {
    const doc = await prisma.document.findUnique({
      where: { id },
      include: { extractionJobs: true },
    });

    if (!doc) {
      throw new NotFoundError(`Document with ID ${id} not found`);
    }

    return this.mapToDTO(doc);
  }

  static mapToDTO(doc: any): DocumentDTO {
    return {
      id: doc.id,
      recordId: doc.recordId,
      workflowId: doc.workflowId,
      fileName: doc.fileName,
      fileType: doc.fileType,
      filePath: doc.filePath,
      fileSize: doc.fileSize,
      fileHash: doc.fileHash,
      documentType: doc.documentType as DocumentType,
      uploadedById: doc.uploadedById,
      createdAt: doc.createdAt.toISOString(),
    };
  }
}
