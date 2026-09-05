import { IOcrEngine, OcrRawExtractionResult, PreprocessingResult } from '../ocr.interface';
import { OcrEngine } from '@land-digitization/shared';
import { env } from '../../../config/env';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { BadRequestError } from '../../../utils/AppError';

export class GeminiVisionEngine implements IOcrEngine {
  readonly engineType = OcrEngine.GEMINI_VISION;

  isConfigured(): boolean {
    return Boolean(env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim().length > 0);
  }

  async extract(input: {
    filePath: string;
    buffer: Buffer;
    mimeType: string;
    preprocessingMeta?: PreprocessingResult['metadata'];
  }): Promise<OcrRawExtractionResult> {
    if (!this.isConfigured()) {
      throw new BadRequestError(
        'Gemini Vision OCR Engine is not configured. Please set the GEMINI_API_KEY environment variable in server configuration.'
      );
    }

    const startTime = Date.now();
    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const base64Data = input.buffer.toString('base64');
    const mime = input.mimeType.includes('pdf') ? 'application/pdf' : 'image/jpeg';

    const prompt = `Perform high-accuracy optical character recognition (OCR) on this scanned Indian Land Record / Property Deed document.
Extract the complete text exactly as written, preserving all numbers, names, locations, and survey markings.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: mime,
        },
      },
    ]);

    const rawText = result.response.text() || '';
    const processingTimeMs = Date.now() - startTime;

    return {
      engine: OcrEngine.GEMINI_VISION,
      rawText,
      confidenceScore: 0.96,
      pageCount: 1,
      processingTimeMs,
      metadata: {
        model: 'gemini-1.5-flash',
        preprocessing: input.preprocessingMeta,
      },
    };
  }
}
