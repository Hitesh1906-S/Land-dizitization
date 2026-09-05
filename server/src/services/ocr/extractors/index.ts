import { IFieldExtractionProvider } from './extractor.interface.js';
import { DeterministicFieldExtractor } from './deterministic.extractor.js';
import { GeminiFieldExtractor } from './gemini.extractor.js';

export * from './extractor.interface.js';
export * from './deterministic.extractor.js';
export * from './gemini.extractor.js';

export class FieldExtractionFactory {
  /**
   * Returns the configured field extractor provider.
   * Can be configured via env var OCR_FIELD_EXTRACTOR_PROVIDER = 'gemini' | 'deterministic'
   */
  public static getExtractor(providerName?: string): IFieldExtractionProvider {
    const chosen =
      providerName ||
      process.env.OCR_FIELD_EXTRACTOR_PROVIDER ||
      (process.env.GEMINI_API_KEY ? 'gemini' : 'deterministic');

    switch (chosen.toLowerCase()) {
      case 'gemini':
      case 'gemini-ai':
        return new GeminiFieldExtractor();
      case 'deterministic':
      case 'rule-based':
      default:
        return new DeterministicFieldExtractor();
    }
  }
}
