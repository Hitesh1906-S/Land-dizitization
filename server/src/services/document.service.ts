import { prisma } from '../config/database';
import { defaultStorageProvider, IStorageProvider } from './storage';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/AppError';
import { DocumentDTO, DocumentType, UserRole } from '@land-digitization/shared';
import { Readable } from 'stream';

export class DocumentService {
  private static storage: IStorageProvider = defaultStorageProvider;

  /**
   * Registers a newly uploaded document file with cryptographic checksum and DB metadata.
   */
  static async registerUpload(
    file: Express.Multer.File,
    data: {
      landRecordId?: string;
      requestId?: string;
      documentType?: DocumentType;
      uploadedById: string;
    }
  ): Promise<DocumentDTO> {
    // 1. Persist binary file to secure storage provider & compute SHA-256
    const stored = await this.storage.saveFile(file);

    // 2. Persist metadata in PostgreSQL via Prisma
    const document = await prisma.document.create({
      data: {
        landRecordId: data.landRecordId || null,
        requestId: data.requestId || null,
        fileName: stored.fileName,
        fileType: stored.fileType,
        filePath: stored.filePath,
        fileSize: stored.fileSize,
        fileHash: stored.fileHash,
        documentType: data.documentType || DocumentType.REGISTRATION_DEED,
        uploadedById: data.uploadedById,
      },
      include: {
        landRecord: { include: { location: true } },
        request: true,
      },
    });

    // 3. Write immutable audit log
    await prisma.auditLog.create({
      data: {
        actorId: data.uploadedById,
        actorRole: 'CITIZEN',
        action: 'CREATE',
        entityType: 'Document',
        entityId: document.id,
        snapshotDiffJson: JSON.stringify({
          fileName: stored.fileName,
          fileHash: stored.fileHash,
          documentType: document.documentType,
          fileSize: stored.fileSize,
        }),
      },
    });

    return this.mapToDTO(document);
  }

  /**
   * Retrieves document metadata by ID.
   */
  static async getDocumentById(id: string, user?: { id: string; role: string }): Promise<DocumentDTO> {
    const doc = await prisma.document.findUnique({
      where: { id },
      include: {
        landRecord: { include: { location: true } },
        request: true,
        ocrResult: {
          include: { extractedFields: true },
        },
      },
    });

    if (!doc) {
      throw new NotFoundError(`Document with ID '${id}' not found`);
    }

    // RBAC check: if user is citizen, verify document access
    if (user && user.role === UserRole.CITIZEN) {
      const isOwner = doc.uploadedById === user.id;
      const isApplicant = doc.request?.applicantId === user.id;
      const isPublicRecord = doc.landRecord?.status === 'VERIFIED';
      if (!isOwner && !isApplicant && !isPublicRecord) {
        throw new ForbiddenError('Access forbidden: You do not have permission to access this document');
      }
    }

    return this.mapToDTO(doc);
  }

  /**
   * Retrieves binary stream, MIME type, and original filename for view/download.
   */
  static async getDocumentStream(
    id: string,
    user?: { id: string; role: string }
  ): Promise<{ stream: Readable; fileName: string; fileType: string; fileSize: number; fileHash: string }> {
    const doc = await this.getDocumentById(id, user);

    const stream = await this.storage.getFileStream(doc.filePath);
    return {
      stream,
      fileName: doc.fileName,
      fileType: doc.fileType,
      fileSize: doc.fileSize,
      fileHash: doc.fileHash,
    };
  }

  /**
   * Lists documents with role-aware filtering.
   */
  static async listDocuments(
    filter: {
      landRecordId?: string;
      requestId?: string;
      uploadedById?: string;
      documentType?: DocumentType;
    },
    user?: { id: string; role: string }
  ): Promise<DocumentDTO[]> {
    const where: any = {};

    if (filter.landRecordId) where.landRecordId = filter.landRecordId;
    if (filter.requestId) where.requestId = filter.requestId;
    if (filter.documentType) where.documentType = filter.documentType;

    if (user && user.role === UserRole.CITIZEN) {
      // Citizens see their own uploads or documents on public verified records
      where.OR = [
        { uploadedById: user.id },
        { request: { applicantId: user.id } },
        { landRecord: { status: 'VERIFIED' } },
      ];
    } else if (filter.uploadedById) {
      where.uploadedById = filter.uploadedById;
    }

    const docs = await prisma.document.findMany({
      where,
      include: {
        landRecord: { include: { location: true } },
        request: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return docs.map((doc) => this.mapToDTO(doc));
  }

  /**
   * Deletes a document with strict role-based permission checks.
   */
  static async deleteDocument(
    id: string,
    user: { id: string; role: string }
  ): Promise<{ deleted: boolean; documentId: string }> {
    const doc = await prisma.document.findUnique({
      where: { id },
      include: {
        landRecord: true,
        request: true,
      },
    });

    if (!doc) {
      throw new NotFoundError(`Document with ID '${id}' not found`);
    }

    // Role-based validation
    if (user.role === UserRole.CITIZEN) {
      if (doc.uploadedById !== user.id) {
        throw new ForbiddenError('Access forbidden: You cannot delete another user\'s document');
      }

      if (doc.landRecord && doc.landRecord.status === 'VERIFIED') {
        throw new ForbiddenError('Statutory restriction: Cannot delete documents attached to a verified land record');
      }

      if (doc.request && (doc.request.stage === 'UNDER_REVIEW' || doc.request.stage === 'PROCESSING' || doc.request.stage === 'VERIFIED')) {
        throw new ForbiddenError(`Cannot delete document: Application is currently in '${doc.request.stage}' stage`);
      }
    }

    // 1. Delete physical file from storage provider
    await this.storage.deleteFile(doc.filePath);

    // 2. Delete record from PostgreSQL database
    await prisma.document.delete({
      where: { id },
    });

    // 3. Record AuditLog entry
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        actorRole: user.role,
        action: 'DELETE',
        entityType: 'Document',
        entityId: id,
        snapshotDiffJson: JSON.stringify({
          deletedFileName: doc.fileName,
          fileHash: doc.fileHash,
          documentType: doc.documentType,
        }),
      },
    });

    return { deleted: true, documentId: id };
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
