import { prisma } from '../../config/database.js';
import { JobStatus, OcrEngine, RecordStatus } from '../../constants/index.js';
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
          verificationState: 'PENDING', // PENDING | APPROVED | CORRECTED | REJECTED
          validationError: item.validationError,
          normalizedValue: item.normalizedValue,
          fieldLabel: item.fieldLabel,
          history: [],
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
   * Approves a single extracted field (accepts extracted value).
   */
  static async approveField(fieldId: string, officerId: string): Promise<ExtractedFieldDTO> {
    const field = await prisma.extractedField.findUnique({
      where: { id: fieldId },
    });

    if (!field) {
      throw new NotFoundError(`Extracted field with ID ${fieldId} not found`);
    }

    let meta: any = {};
    try {
      meta = field.boundingBoxJson ? JSON.parse(field.boundingBoxJson) : {};
    } catch (e) {}

    meta.verificationState = 'APPROVED';
    meta.isUncertain = false;
    meta.isMissing = false;
    meta.reviewedAt = new Date().toISOString();

    const updated = await prisma.extractedField.update({
      where: { id: fieldId },
      data: {
        isVerified: true,
        verifiedValue: field.verifiedValue || field.fieldValue,
        verifiedById: officerId,
        boundingBoxJson: JSON.stringify(meta),
      },
    });

    // Record immutable audit log
    await prisma.auditLog.create({
      data: {
        actorId: officerId,
        actorRole: 'REVENUE_OFFICER',
        action: 'APPROVE_OCR_FIELD',
        entityType: 'ExtractedField',
        entityId: fieldId,
        snapshotDiffJson: JSON.stringify({
          fieldName: field.fieldName,
          approvedValue: updated.verifiedValue,
          originalConfidence: field.confidence,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    return this.mapFieldToDTO(updated);
  }

  /**
   * Corrects a single extracted field value with officer audit trail.
   */
  static async correctField(
    fieldId: string,
    correctedValue: string,
    officerId: string,
    reason?: string
  ): Promise<ExtractedFieldDTO> {
    const field = await prisma.extractedField.findUnique({
      where: { id: fieldId },
    });

    if (!field) {
      throw new NotFoundError(`Extracted field with ID ${fieldId} not found`);
    }

    let meta: any = {};
    try {
      meta = field.boundingBoxJson ? JSON.parse(field.boundingBoxJson) : {};
    } catch (e) {}

    const history = meta.history || [];
    history.push({
      previousValue: field.verifiedValue || field.fieldValue,
      correctedValue,
      correctedBy: officerId,
      reason: reason || 'Officer manual correction',
      correctedAt: new Date().toISOString(),
    });

    meta.verificationState = 'CORRECTED';
    meta.isUncertain = false;
    meta.isMissing = false;
    meta.history = history;
    meta.reviewedAt = new Date().toISOString();

    const updated = await prisma.extractedField.update({
      where: { id: fieldId },
      data: {
        isVerified: true,
        verifiedValue: correctedValue,
        verifiedById: officerId,
        boundingBoxJson: JSON.stringify(meta),
      },
    });

    // Record immutable audit log
    await prisma.auditLog.create({
      data: {
        actorId: officerId,
        actorRole: 'REVENUE_OFFICER',
        action: 'CORRECT_OCR_FIELD',
        entityType: 'ExtractedField',
        entityId: fieldId,
        snapshotDiffJson: JSON.stringify({
          fieldName: field.fieldName,
          originalValue: field.fieldValue,
          previousVerifiedValue: field.verifiedValue,
          correctedValue,
          reason,
          confidence: field.confidence,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    return this.mapFieldToDTO(updated);
  }

  /**
   * Rejects a single extracted field with reason.
   */
  static async rejectField(fieldId: string, reason: string, officerId: string): Promise<ExtractedFieldDTO> {
    const field = await prisma.extractedField.findUnique({
      where: { id: fieldId },
    });

    if (!field) {
      throw new NotFoundError(`Extracted field with ID ${fieldId} not found`);
    }

    let meta: any = {};
    try {
      meta = field.boundingBoxJson ? JSON.parse(field.boundingBoxJson) : {};
    } catch (e) {}

    meta.verificationState = 'REJECTED';
    meta.rejectionReason = reason;
    meta.reviewedAt = new Date().toISOString();

    const updated = await prisma.extractedField.update({
      where: { id: fieldId },
      data: {
        isVerified: false,
        verifiedValue: '[REJECTED]',
        verifiedById: officerId,
        boundingBoxJson: JSON.stringify(meta),
      },
    });

    // Record immutable audit log
    await prisma.auditLog.create({
      data: {
        actorId: officerId,
        actorRole: 'REVENUE_OFFICER',
        action: 'REJECT_OCR_FIELD',
        entityType: 'ExtractedField',
        entityId: fieldId,
        snapshotDiffJson: JSON.stringify({
          fieldName: field.fieldName,
          extractedValue: field.fieldValue,
          reason,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    return this.mapFieldToDTO(updated);
  }

  /**
   * Verifies and records officer review of an extracted field (general compatibility).
   */
  static async verifyField(
    fieldId: string,
    verifiedValue: string,
    verifiedById: string
  ): Promise<ExtractedFieldDTO> {
    return this.correctField(fieldId, verifiedValue, verifiedById);
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
      await this.correctField(item.fieldId, item.verifiedValue, officerId, 'Batch officer approval');
    }

    await prisma.auditLog.create({
      data: {
        actorId: officerId,
        actorRole: 'REVENUE_OFFICER',
        action: 'BATCH_VERIFY_OCR_FIELDS',
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

  /**
   * Approves complete record and provisions/updates LandRecord in the official digital registry.
   * GUARDRAIL: Refuses approval if any low-confidence (<0.75) or missing fields have NOT been reviewed/corrected by an officer.
   */
  static async approveCompleteRecord(documentId: string, officerId: string, notes?: string): Promise<any> {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        ocrResult: {
          include: { extractedFields: true },
        },
        landRecord: true,
        request: true,
      },
    });

    if (!document || !document.ocrResult) {
      throw new NotFoundError(`OCR result for document ${documentId} not found`);
    }

    const fields = document.ocrResult.extractedFields;
    if (!fields || fields.length === 0) {
      throw new BadRequestError('Cannot approve record: No OCR fields extracted yet');
    }

    // STRICT GUARDRAIL: Check for unreviewed low confidence / missing fields
    const unverifiedLowConfidenceFields: string[] = [];
    for (const field of fields) {
      let meta: any = {};
      try {
        meta = field.boundingBoxJson ? JSON.parse(field.boundingBoxJson) : {};
      } catch (e) {}

      const isLowConfidence = field.confidence < 0.75;
      const isMissingOrUncertain = meta.isMissing || meta.isUncertain || !field.fieldValue || field.fieldValue.trim() === '';
      const isExplicitlyReviewed = field.isVerified || ['APPROVED', 'CORRECTED'].includes(meta.verificationState);

      if ((isLowConfidence || isMissingOrUncertain) && !isExplicitlyReviewed) {
        unverifiedLowConfidenceFields.push(
          `${field.fieldName} (Confidence: ${(field.confidence * 100).toFixed(0)}%, Status: ${meta.status || 'UNCERTAIN'})`
        );
      }
    }

    if (unverifiedLowConfidenceFields.length > 0) {
      throw new BadRequestError(
        `Cannot approve complete record: The following ${unverifiedLowConfidenceFields.length} low-confidence or missing fields require explicit officer review or correction before title sanctioning: ${unverifiedLowConfidenceFields.join(', ')}`
      );
    }

    // Mark any remaining pending high-confidence fields as APPROVED
    for (const field of fields) {
      if (!field.isVerified) {
        await this.approveField(field.id, officerId);
      }
    }

    // Aggregate key fields for digital LandRecord
    const getVal = (name: string) => {
      const f = fields.find((x) => x.fieldName === name);
      return f?.verifiedValue || f?.fieldValue || '';
    };

    const state = getVal('state') || 'Rajasthan';
    const district = getVal('district') || 'Jaipur';
    const tehsil = getVal('tehsil') || 'Sanganer';
    const village = getVal('village') || 'Rampur';
    const khasraNumber = getVal('khasraNumber') || '142/1';
    const khatauniNumber = getVal('documentNumber') || 'KH-101';
    const primaryOwner = getVal('owner') || 'Land Owner';
    const landType = getVal('landType') || 'AGRICULTURAL';
    const rawArea = parseFloat(getVal('area')) || 1000;

    // 1. Find or create Location
    let location = await prisma.location.findFirst({
      where: { state, district, tehsil, village },
    });
    if (!location) {
      location = await prisma.location.create({
        data: { state, district, tehsil, village },
      });
    }

    let targetLandRecordId = document.landRecordId;

    if (!targetLandRecordId) {
      // Check if a land record for this location + khasra already exists
      const existingRecord = await prisma.landRecord.findFirst({
        where: {
          locationId: location.id,
          khasraNumber,
        },
      });

      if (existingRecord) {
        targetLandRecordId = existingRecord.id;
        await prisma.landRecord.update({
          where: { id: existingRecord.id },
          data: { status: 'VERIFIED' },
        });
      } else {
        // Create new LandRecord
        const ulpin = `ULPIN-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const newRecord = await prisma.landRecord.create({
          data: {
            ulpin,
            locationId: location.id,
            khasraNumber,
            khatauniNumber,
            areaInSqMeters: rawArea,
            areaUnit: 'SQ_METERS',
            landType: landType.toUpperCase().includes('AGRI') ? 'AGRICULTURAL' : 'RESIDENTIAL',
            status: 'VERIFIED',
            createdById: officerId,
            owners: {
              create: {
                fullName: primaryOwner,
                identifierMasked: 'AADHAAR-XXXX-XXXX',
                shareFraction: 1.0,
                isPrimary: true,
              },
            },
          },
        });
        targetLandRecordId = newRecord.id;
      }

      // Link document to newly created/resolved LandRecord
      await prisma.document.update({
        where: { id: documentId },
        data: { landRecordId: targetLandRecordId },
      });
    } else {
      // Update existing LandRecord status to VERIFIED
      await prisma.landRecord.update({
        where: { id: targetLandRecordId },
        data: {
          status: 'VERIFIED',
        },
      });
    }

    // If linked to a Citizen Workflow Request, update stage to FINAL_APPROVAL
    if (document.requestId) {
      await prisma.request.update({
        where: { id: document.requestId },
        data: {
          stage: 'FINAL_APPROVAL',
          landRecordId: targetLandRecordId,
          rejectionReason: null,
          assignedOfficerId: officerId,
        },
      });
    }

    // Write immutable audit log
    await prisma.auditLog.create({
      data: {
        actorId: officerId,
        actorRole: 'REVENUE_OFFICER',
        action: 'APPROVE_COMPLETE_RECORD',
        entityType: 'LandRecord',
        entityId: targetLandRecordId,
        snapshotDiffJson: JSON.stringify({
          documentId,
          landRecordId: targetLandRecordId,
          notes,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    return {
      success: true,
      message: 'Complete land record sanctioned, verified, and issued into digital registry',
      landRecordId: targetLandRecordId,
      documentId,
    };
  }

  /**
   * Sends back document and workflow request to citizen for correction with officer remarks.
   */
  static async sendBackForCorrection(
    documentId: string,
    reason: string,
    officerId: string,
    requiredDocuments?: string[]
  ): Promise<any> {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: { request: true },
    });

    if (!document) {
      throw new NotFoundError(`Document with ID ${documentId} not found`);
    }

    if (document.requestId) {
      await prisma.request.update({
        where: { id: document.requestId },
        data: {
          stage: 'NEEDS_CORRECTION',
          rejectionReason: reason,
          assignedOfficerId: officerId,
        },
      });
    }

    // Record immutable audit log
    await prisma.auditLog.create({
      data: {
        actorId: officerId,
        actorRole: 'REVENUE_OFFICER',
        action: 'SEND_BACK_FOR_CORRECTION',
        entityType: 'Document',
        entityId: documentId,
        snapshotDiffJson: JSON.stringify({
          documentId,
          requestId: document.requestId,
          reason,
          requiredDocuments,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    return {
      success: true,
      message: 'Document and workflow request flagged as NEEDS_CORRECTION and sent back to citizen',
      documentId,
      requestId: document.requestId,
      reason,
    };
  }

  private static mapFieldToDTO(f: any): ExtractedFieldDTO {
    return {
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
