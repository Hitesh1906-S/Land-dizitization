import { OcrEngine, JobStatus } from '@land-digitization/shared';

export interface PreprocessingResult {
  preprocessedBuffer: Buffer;
  mimeType: string;
  metadata: {
    deskewAngleDeg: number;
    contrastApplied: boolean;
    denoised: boolean;
    scalingFactor: number;
    originalSize: number;
    processedSize: number;
  };
}

export interface OcrToken {
  text: string;
  confidence: number;
  bbox?: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
}

export interface OcrRawExtractionResult {
  engine: OcrEngine;
  rawText: string;
  confidenceScore: number; // 0.0 to 1.0
  pageCount: number;
  tokens?: OcrToken[];
  processingTimeMs: number;
  metadata?: Record<string, any>;
}

export interface ExtractedFieldItem {
  fieldName: string;
  fieldValue: string;
  confidence: number;
  boundingBox?: Record<string, any>;
}

export interface IOcrEngine {
  readonly engineType: OcrEngine;
  isConfigured(): boolean;
  extract(
    input: {
      filePath: string;
      buffer: Buffer;
      mimeType: string;
      preprocessingMeta?: PreprocessingResult['metadata'];
    }
  ): Promise<OcrRawExtractionResult>;
}
