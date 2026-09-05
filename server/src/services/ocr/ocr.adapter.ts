import { prisma } from '../../config/database.js';
import { JobStatus, OcrEngine } from '../../constants/index.js';
import { NotFoundError, BadRequestError } from '../../utils/AppError.js';
import { OCRResultDTO, ExtractedFieldDTO } from '@land-digitization/shared';
import { defaultStorageProvider } from '../storage/index.js';
import { DocumentPreprocessor } from './preprocessor.js';
import { OcrEngineFactory } from './engines/index.js';
import { FieldExtractionFactory, StructuredLandRecordResult } from './extractors/index.js';
import fs from 'fs';

export class OcrService {
  /**
   * Starts and executes real OCR extraction on an uploaded document and extracts 12 structured fields.
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

      // 6. Extract structured land record fields from raw text via Pluggable Field Extractor
      const fieldExtractor = FieldExtractionFactory.getExtractor();
      const extractionResult = await fieldExtractor.extractFields(rawExtraction.rawText);

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

      // 8. Persist granular ExtractedField records with rich provenance metadata
      for (const item of extractionResult.fieldList) {
        const metaPayload = {
          sourceSnippet: item.sourceSnippet,
          isUncertain: item.isUncertain,
          isMissing: item.isMissing,
          status: item.status,
          validationError: item.validationError,
          normalizedValue: item.normalizedValue,
          fieldLabel: item.fieldLabel,
        };

        await prisma.extractedField.create({
          data: {
            ocrResultId: updatedResult.id,
            fieldName: item.fieldName,
            fieldValue: item.fieldValue || '',
            confidence: item.confidence,
            boundingBoxJson: JSON.stringify(metaPayload),
            isVerified: false,
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
            extractor: fieldExtractor.providerName,
            confidenceScore: rawExtraction.confidenceScore,
            fieldsExtracted: extractionResult.extractedFieldsCount,
            uncertainFields: extractionResult.uncertainFieldsCount,
            missingFields: extractionResult.missingFieldsCount,
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
   * Directly extracts structured fields from given OCR text using the specified provider.
   */
  static async extractStructuredFields(
    rawOcrText: string,
    providerName?: string
  ): Promise<StructuredLandRecordResult> {
    const extractor = FieldExtractionFactory.getExtractor(providerName);
    return extractor.extractFields(rawOcrText);
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
  static async verifyField(
    fieldId: string,
    verifiedValue: string,
    verifiedById: string
  ): Promise<ExtractedFieldDTO> {
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

  /**
   * Batch verifies all extracted fields for a document.
   */
  static async batchVerifyFields(
    documentId: string,
    verifications: Array<{ fieldId: string; verifiedValue: string }>,
    officerId: string
  ): Promise<OCRResultDTO> {
    for (const item of verifications) {
      await prisma.extractedField.update({
        where: { id: item.fieldId },
        data: {
          isVerified: true,
          verifiedValue: item.verifiedValue,
          verifiedById: officerId,
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        actorId: officerId,
        actorRole: 'REVENUE_OFFICER',
        action: 'VERIFY_OCR_FIELDS',
        entityType: 'Document',
        entityId: documentId,
        snapshotDiffJson: JSON.stringify({
          documentId,
          verifiedFieldsCount: verifications.length,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    return this.getResultByDocumentId(documentId);
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
