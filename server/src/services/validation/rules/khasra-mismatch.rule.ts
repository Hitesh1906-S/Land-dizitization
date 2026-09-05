import { IValidationRule, ValidationCheckResult, ValidationContext } from './rule.interface.js';

export class KhasraSurveyMismatchRule implements IValidationRule {
  readonly ruleCode = 'KHASRA_SURVEY_MISMATCH';
  readonly name = 'Khasra & Survey Number Consistency Check';
  readonly category = 'KHASRA_CHECK' as const;
  readonly defaultSeverity = 'CRITICAL' as const;
  readonly description = 'Validates state cadastral numbering format and cross-matches registered Khasra number against scanned deed OCR extraction.';

  async validate(context: ValidationContext): Promise<ValidationCheckResult> {
    const { record } = context;

    // 1. Cadastral Syntax Format Check
    const khasraPattern = /^[0-9]+(\/[0-9]+)*[A-Za-z]?$/;
    if (!record.khasraNumber || !khasraPattern.test(record.khasraNumber.trim())) {
      return {
        ruleCode: this.ruleCode,
        name: this.name,
        category: this.category,
        passed: false,
        severity: 'CRITICAL',
        title: 'Invalid Cadastral Numbering Syntax',
        explanation: `Khasra number "${record.khasraNumber}" does not follow standard revenue survey format (e.g. 142, 142/4, 205/3/1).`,
        conflictingValues: {
          expected: 'Valid numeric cadastral pattern (e.g. 142/4/1)',
          actual: record.khasraNumber,
        },
        recommendedAction: 'Correct Khasra numbering according to the official village cadastral index map.',
      };
    }

    // 2. Cross-Reference against Scanned Deed OCR Extraction
    if (record.documents && record.documents.length > 0) {
      for (const doc of record.documents) {
        if (doc.ocrResult?.extractedFields) {
          const ocrKhasraField = doc.ocrResult.extractedFields.find((f) => f.fieldName === 'khasraNumber');
          if (ocrKhasraField && ocrKhasraField.fieldValue && ocrKhasraField.fieldValue.trim().length > 0) {
            const ocrKhasra = ocrKhasraField.fieldValue.trim();
            const recordKhasra = record.khasraNumber.trim();

            if (ocrKhasra !== recordKhasra) {
              return {
                ruleCode: this.ruleCode,
                name: this.name,
                category: this.category,
                passed: false,
                severity: 'CRITICAL',
                title: 'Recorded Khasra vs Scanned Deed Discrepancy',
                explanation: `Registered Khasra number "${recordKhasra}" does not match Khasra "${ocrKhasra}" extracted from the scanned deed document.`,
                conflictingValues: {
                  registered: recordKhasra,
                  ocrExtracted: ocrKhasra,
                },
                recommendedAction: 'Inspect original certified physical Jamabandi to confirm correct parcel survey partition.',
              };
            }
          }
        }
      }
    }

    return {
      ruleCode: this.ruleCode,
      name: this.name,
      category: this.category,
      passed: true,
      severity: 'INFO',
      title: 'Khasra Number Verified',
      explanation: `Khasra number "${record.khasraNumber}" complies with cadastral syntax and matches supporting deed documentation.`,
      recommendedAction: 'No action required.',
    };
  }
}
