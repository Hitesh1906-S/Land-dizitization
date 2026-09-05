import { prisma } from '../config/database';
import { calculateFileHash } from '../utils/hash';
import { NotFoundError } from '../utils/AppError';
import { DocumentDTO, DocumentType } from '@land-digitization/shared';

export class DocumentService {
  static async registerUpload(file: Express.Multer.File, data: {
    landRecordId?: string;
    requestId?: string;
    documentType?: DocumentType;
    uploadedById: string;
  }): Promise<DocumentDTO> {
    const fileHash = await calculateFileHash(file.path);

    const document = await prisma.document.create({
      data: {
        landRecordId: data.landRecordId,
        requestId: data.requestId,
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

  static async getDocumentById(id: string): Promise<DocumentDTO> {
    const doc = await prisma.document.findUnique({
      where: { id },
      include: {
        ocrResult: {
          include: { extractedFields: true },
        },
      },
    });

    if (!doc) {
      throw new NotFoundError(`Document with ID ${id} not found`);
    }

    return this.mapToDTO(doc);
  }

  static async listDocuments(filter: {
    landRecordId?: string;
    requestId?: string;
    uploadedById?: string;
  }): Promise<DocumentDTO[]> {
    const docs = await prisma.document.findMany({
      where: {
        ...(filter.landRecordId && { landRecordId: filter.landRecordId }),
        ...(filter.requestId && { requestId: filter.requestId }),
        ...(filter.uploadedById && { uploadedById: filter.uploadedById }),
      },
      orderBy: { createdAt: 'desc' },
    });

    return docs.map((doc) => this.mapToDTO(doc));
  }

  static mapToDTO(doc: any): DocumentDTO {
    return {
      id: doc.id,
      landRecordId: doc.landRecordId || undefined,
      requestId: doc.requestId || undefined,
      fileName: doc.fileName,
      fileType: doc.fileType,
      filePath: doc.filePath,
      fileSize: doc.fileSize,
      fileHash: doc.fileHash,
      documentType: doc.documentType as DocumentType,
      uploadedById: doc.uploadedById,
      createdAt: doc.createdAt.toISOString(),
      ocrResult: doc.ocrResult ? {
        id: doc.ocrResult.id,
        documentId: doc.ocrResult.documentId,
        status: doc.ocrResult.status,
        rawText: doc.ocrResult.rawText || undefined,
        confidenceScore: doc.ocrResult.confidenceScore || undefined,
        engine: doc.ocrResult.engine,
        pageCount: doc.ocrResult.pageCount,
        processingTimeMs: doc.ocrResult.processingTimeMs || undefined,
        completedAt: doc.ocrResult.completedAt ? doc.ocrResult.completedAt.toISOString() : undefined,
        createdAt: doc.ocrResult.createdAt.toISOString(),
        extractedFields: doc.ocrResult.extractedFields ? doc.ocrResult.extractedFields.map((f: any) => ({
          id: f.id,
          ocrResultId: f.ocrResultId,
          fieldName: f.fieldName,
          fieldValue: f.fieldValue,
          confidence: f.confidence,
          boundingBoxJson: f.boundingBoxJson || undefined,
          isVerified: f.isVerified,
          verifiedValue: f.verifiedValue || undefined,
          verifiedById: f.verifiedById || undefined,
          createdAt: f.createdAt.toISOString(),
        })) : [],
      } : undefined,
    };
  }
}
