export interface FieldExtractionItem {
  fieldName:
    | 'owner'
    | 'coOwner'
    | 'khasraNumber'
    | 'plotNumber'
    | 'area'
    | 'village'
    | 'tehsil'
    | 'district'
    | 'state'
    | 'landType'
    | 'registrationDate'
    | 'documentNumber';
  fieldLabel: string;
  fieldValue: string | null;
  confidence: number; // 0.0 to 1.0
  sourceSnippet: string | null; // exact matching line/snippet from OCR text
  isUncertain: boolean;
  isMissing: boolean;
  status: 'CONFIRMED' | 'UNCERTAIN' | 'MISSING';
  validationRulesMet: boolean;
  validationError?: string;
  normalizedValue?: string | number | null;
}

export interface StructuredLandRecordResult {
  provider: 'gemini-ai' | 'deterministic-rule-engine' | 'custom-ai';
  extractedAt: string;
  overallConfidence: number;
  totalFieldsCount: number;
  extractedFieldsCount: number;
  uncertainFieldsCount: number;
  missingFieldsCount: number;
  rawOcrLength: number;
  fields: Record<string, FieldExtractionItem>;
  fieldList: FieldExtractionItem[];
}

export interface IFieldExtractionProvider {
  readonly providerName: 'gemini-ai' | 'deterministic-rule-engine' | 'custom-ai';
  extractFields(ocrText: string): Promise<StructuredLandRecordResult>;
}
