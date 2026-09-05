import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  FieldExtractionItem,
  IFieldExtractionProvider,
  StructuredLandRecordResult,
} from './extractor.interface.js';
import { DeterministicFieldExtractor } from './deterministic.extractor.js';
import { env } from '../../../config/env.js';

export class GeminiFieldExtractor implements IFieldExtractionProvider {
  public readonly providerName = 'gemini-ai' as const;
  private readonly fallbackExtractor = new DeterministicFieldExtractor();

  public async extractFields(ocrText: string): Promise<StructuredLandRecordResult> {
    const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim().length === 0) {
      return this.fallbackExtractor.extractFields(ocrText);
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: {
          responseMimeType: 'application/json',
        },
      });

      const prompt = `You are an expert Government Land Record Data Extraction Engine.
Extract the 12 land record fields from the OCR text below.
STRICT RULES:
1. NEVER hallucinate or invent information.
2. If a field is not present in the OCR text, set "fieldValue" to null, "isMissing" to true, and "status" to "MISSING".
3. If a field is ambiguous or partially unclear, set "isUncertain" to true and provide an honest confidence score between 0.1 and 0.7.
4. If a field is clearly stated, set confidence between 0.85 and 1.0.
5. In "sourceSnippet", quote the exact line or phrase from the OCR text. If missing, set to null.

Format as a JSON object with a "fields" array:
{
  "fields": [
    {
      "fieldName": "owner" | "coOwner" | "khasraNumber" | "plotNumber" | "area" | "village" | "tehsil" | "district" | "state" | "landType" | "registrationDate" | "documentNumber",
      "fieldLabel": "Field Name",
      "fieldValue": "Extracted string or null",
      "confidence": 0.95,
      "sourceSnippet": "exact snippet line or null",
      "isUncertain": false,
      "isMissing": false,
      "status": "CONFIRMED" | "UNCERTAIN" | "MISSING",
      "validationError": null
    }
  ]
}

OCR TEXT:
"""
${ocrText}
"""`;

      const result = await model.generateContent(prompt);
      const text = result.response.text()?.trim() || '{}';
      const parsed = JSON.parse(text);

      if (parsed && Array.isArray(parsed.fields) && parsed.fields.length > 0) {
        const fieldsRecord: Record<string, FieldExtractionItem> = {};
        const fieldList: FieldExtractionItem[] = [];

        for (const item of parsed.fields) {
          const formattedItem: FieldExtractionItem = {
            fieldName: item.fieldName,
            fieldLabel: item.fieldLabel || item.fieldName,
            fieldValue: item.fieldValue ?? null,
            confidence: Number(item.confidence || 0),
            sourceSnippet: item.sourceSnippet ?? null,
            isUncertain: Boolean(item.isUncertain),
            isMissing: Boolean(item.isMissing || !item.fieldValue),
            status: item.isMissing || !item.fieldValue ? 'MISSING' : (item.isUncertain ? 'UNCERTAIN' : 'CONFIRMED'),
            validationRulesMet: !item.isMissing,
            validationError: item.validationError,
          };
          fieldsRecord[item.fieldName] = formattedItem;
          fieldList.push(formattedItem);
        }

        const totalFieldsCount = fieldList.length;
        const extractedFieldsCount = fieldList.filter((f) => !f.isMissing).length;
        const uncertainFieldsCount = fieldList.filter((f) => f.isUncertain).length;
        const missingFieldsCount = fieldList.filter((f) => f.isMissing).length;

        const validConfidenceSum = fieldList
          .filter((f) => !f.isMissing)
          .reduce((sum, f) => sum + f.confidence, 0);

        const overallConfidence =
          extractedFieldsCount > 0
            ? Number((validConfidenceSum / extractedFieldsCount).toFixed(2))
            : 0.0;

        return {
          provider: this.providerName,
          extractedAt: new Date().toISOString(),
          overallConfidence,
          totalFieldsCount,
          extractedFieldsCount,
          uncertainFieldsCount,
          missingFieldsCount,
          rawOcrLength: ocrText.length,
          fields: fieldsRecord,
          fieldList,
        };
      }

      return this.fallbackExtractor.extractFields(ocrText);
    } catch (err) {
      console.warn('[GeminiFieldExtractor] API call failed or encountered error, falling back to deterministic extractor:', err);
      return this.fallbackExtractor.extractFields(ocrText);
    }
  }
}
