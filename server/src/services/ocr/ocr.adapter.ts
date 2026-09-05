import { prisma } from '../../config/database';
import { JobStatus, OcrEngine } from '../../constants';
import { NotFoundError, BadRequestError } from '../../utils/AppError';
import { OCRResultDTO, ExtractedFieldDTO } from '@land-digitization/shared';
import { defaultStorageProvider } from '../storage';
import { DocumentPreprocessor } from './preprocessor';
import { OcrEngineFactory } from './engines';
import { LandFieldExtractor } from './field.extractor';
import fs from 'fs';

export class OcrService {
  /**
   * Starts and executes real OCR extraction on an uploaded document.
   */
  static async startExtractionJob(
    documentId: string,
    engine: OcrEngine = OcrEngine.HYBRID,
    preprocessingOptions?: { enableDeskew?: boolean; enableContrast?: boolean; enableDenoise?: boolean }
  ): Promise<OCRResultDTO> {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundError(`Document with ID '${documentId}' not found`);
    }

    // 1. Initialize or update OCRResult record in PostgreSQL as PROCESSING
    let ocrResult = await prisma.oCRResult.findUnique({
      where: { documentId },
    });

    if (ocrResult) {
      ocrResult = await prisma.oCRResult.update({
        where: { id: ocrResult.id },
        data: {
          status: JobStatus.PROCESSING,
          engine,
        },
      });
      // Clear previous extracted fields if re-running
      await prisma.extractedField.deleteMany({
        where: { ocrResultId: ocrResult.id },
      });
    } else {
      ocrResult = await prisma.oCRResult.create({
        data: {
          documentId,
          status: JobStatus.PROCESSING,
          engine,
        },
      });
    }

    const startTime = Date.now();

    try {
      // 2. Fetch binary buffer from storage provider
      let fileBuffer: Buffer;
      try {
        fileBuffer = await defaultStorageProvider.getFileBuffer(document.filePath);
      } catch (err: any) {
        // Fallback check if file exists directly on disk
        if (fs.existsSync(document.filePath)) {
          fileBuffer = fs.readFileSync(document.filePath);
        } else {
          throw new NotFoundError(`Physical file '${document.filePath}' not found on storage disk`);
        }
      }

      // 3. Run Preprocessing Pipeline (Deskew, Denoise, Contrast, Scaling)
      const preprocessed = await DocumentPreprocessor.preprocess(
        fileBuffer,
        document.fileType,
        preprocessingOptions
      );

      // 4. Select Pluggable OCR Engine
      const selectedEngine = OcrEngineFactory.getEngine(engine);
      const absPath = defaultStorageProvider.getAbsolutePath(document.filePath);

      // 5. Execute OCR Extraction
      const rawExtraction = await selectedEngine.extract({
        filePath: absPath,
        buffer: preprocessed.preprocessedBuffer,
        mimeType: document.fileType,
        preprocessingMeta: preprocessed.metadata,
      });

      const totalProcessingTimeMs = Date.now() - startTime;

      // 6. Extract structured land record fields from raw text
      const extractedFields = LandFieldExtractor.extractFields(
        rawExtraction.rawText,
        rawExtraction.confidenceScore
      );

      // 7. Persist completed OCRResult in PostgreSQL
      const updatedResult = await prisma.oCRResult.update({
        where: { id: ocrResult.id },
        data: {
          status: JobStatus.COMPLETED,
          rawText: rawExtraction.rawText,
          confidenceScore: rawExtraction.confidenceScore,
          pageCount: rawExtraction.pageCount || 1,
          processingTimeMs: totalProcessingTimeMs,
          completedAt: new Date(),
        },
      });

      // 8. Persist granular ExtractedField records
      for (const field of extractedFields) {
        await prisma.extractedField.create({
          data: {
            ocrResultId: updatedResult.id,
            fieldName: field.fieldName,
            fieldValue: field.fieldValue,
            confidence: field.confidence,
            boundingBoxJson: field.boundingBox ? JSON.stringify(field.boundingBox) : null,
          },
        });
      }

      // 9. Write immutable audit log
      await prisma.auditLog.create({
        data: {
          actorId: document.uploadedById,
          actorRole: 'SYSTEM_OCR',
          action: 'RUN_OCR',
          entityType: 'OCRResult',
          entityId: updatedResult.id,
          snapshotDiffJson: JSON.stringify({
            documentId,
            engine: rawExtraction.engine,
            confidenceScore: rawExtraction.confidenceScore,
            fieldsCount: extractedFields.length,
            processingTimeMs: totalProcessingTimeMs,
          }),
        },
      });

      return this.getResultByDocumentId(documentId);
    } catch (err: any) {
      console.error('OCR Processing Pipeline failed:', err);
      const totalProcessingTimeMs = Date.now() - startTime;

      await prisma.oCRResult.update({
        where: { id: ocrResult.id },
        data: {
          status: JobStatus.FAILED,
          rawText: `OCR Pipeline Error: ${err.message}`,
          processingTimeMs: totalProcessingTimeMs,
        },
      });

      return this.getResultByDocumentId(documentId);
    }
  }

  /**
   * Retrieves OCR result by Document ID with all extracted fields.
   */
  static async getResultByDocumentId(documentId: string): Promise<OCRResultDTO> {
    const result = await prisma.oCRResult.findUnique({
      where: { documentId },
      include: { extractedFields: true },
    });

    if (!result) {
      throw new NotFoundError(`OCR result for document ${documentId} not found`);
    }

    return this.mapToDTO(result);
  }

  /**
   * Verifies and records officer review of an extracted field.
   */
  static async verifyField(fieldId: string, verifiedValue: string, verifiedById: string): Promise<ExtractedFieldDTO> {
    const field = await prisma.extractedField.findUnique({
      where: { id: fieldId },
    });

    if (!field) {
      throw new NotFoundError(`Extracted field with ID ${fieldId} not found`);
    }

    const updated = await prisma.extractedField.update({
      where: { id: fieldId },
      data: {
        isVerified: true,
        verifiedValue,
        verifiedById,
      },
    });

    return {
      id: updated.id,
      ocrResultId: updated.ocrResultId,
      fieldName: updated.fieldName,
      fieldValue: updated.fieldValue,
      confidence: updated.confidence,
      boundingBoxJson: updated.boundingBoxJson || undefined,
      isVerified: updated.isVerified,
      verifiedValue: updated.verifiedValue || undefined,
      verifiedById: updated.verifiedById || undefined,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  static mapToDTO(result: any): OCRResultDTO {
    return {
      id: result.id,
      documentId: result.documentId,
      status: result.status,
      rawText: result.rawText || undefined,
      confidenceScore: result.confidenceScore || undefined,
      engine: result.engine,
      pageCount: result.pageCount,
      processingTimeMs: result.processingTimeMs || undefined,
      completedAt: result.completedAt ? result.completedAt.toISOString() : undefined,
      createdAt: result.createdAt.toISOString(),
      extractedFields: result.extractedFields
        ? result.extractedFields.map((f: any) => ({
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
          }))
        : [],
    };
  }
}
