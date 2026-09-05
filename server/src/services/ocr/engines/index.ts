import { IOcrEngine } from '../ocr.interface';
import { OcrEngine } from '@land-digitization/shared';
import { TesseractEngine } from './tesseract.engine';
import { GeminiVisionEngine } from './gemini.engine';

export class OcrEngineFactory {
  private static engines = new Map<OcrEngine, IOcrEngine>([
    [OcrEngine.TESSERACT, new TesseractEngine()],
    [OcrEngine.GEMINI_VISION, new GeminiVisionEngine()],
  ]);

  static getEngine(engineType: OcrEngine = OcrEngine.HYBRID): IOcrEngine {
    if (engineType === OcrEngine.GEMINI_VISION) {
      return this.engines.get(OcrEngine.GEMINI_VISION)!;
    }

    if (engineType === OcrEngine.HYBRID) {
      const gemini = this.engines.get(OcrEngine.GEMINI_VISION)!;
      if (gemini.isConfigured()) {
        return gemini;
      }
      return this.engines.get(OcrEngine.TESSERACT)!;
    }

    return this.engines.get(OcrEngine.TESSERACT)!;
  }
}

export * from './tesseract.engine';
export * from './gemini.engine';
