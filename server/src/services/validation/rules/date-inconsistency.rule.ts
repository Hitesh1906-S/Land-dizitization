import { IValidationRule, ValidationCheckResult, ValidationContext } from './rule.interface.js';

export class DateInconsistencyRule implements IValidationRule {
  readonly ruleCode = 'DATE_INCONSISTENCY';
  readonly name = 'Chronological & Registration Date Consistency Check';
  readonly category = 'DATE_CHECK' as const;
  readonly defaultSeverity = 'WARNING' as const;
  readonly description = 'Verifies that registration and mutation dates are non-future, follow chronological order, and match deed timeline stamps.';

  async validate(context: ValidationContext): Promise<ValidationCheckResult> {
    const { record } = context;
    const now = new Date();

    // 1. Prevent Future Creation/Mutation Dates
    if (record.createdAt && new Date(record.createdAt) > now) {
      return {
        ruleCode: this.ruleCode,
        name: this.name,
        category: this.category,
        passed: false,
        severity: 'CRITICAL',
        title: 'Future Creation Date Detected',
        explanation: `Record timestamp (${record.createdAt}) is set in the future.`,
        conflictingValues: { expected: `<= ${now.toISOString()}`, actual: record.createdAt.toISOString() },
        recommendedAction: 'Correct system server timestamp and record synchronization clock.',
      };
    }

    // 2. Ownership Mutation History Chronology Check
    if (record.ownershipHistory && record.ownershipHistory.length > 1) {
      for (let i = 0; i < record.ownershipHistory.length - 1; i++) {
        const current = new Date(record.ownershipHistory[i].mutationDate);
        const next = new Date(record.ownershipHistory[i + 1].mutationDate);

        if (current < next) {
          return {
            ruleCode: this.ruleCode,
            name: this.name,
            category: this.category,
            passed: false,
            severity: 'WARNING',
            title: 'Out-of-Sequence Mutation History Timeline',
            explanation: `Mutation order recorded on ${current.toISOString().slice(0, 10)} predates earlier registered transfer on ${next.toISOString().slice(0, 10)}.`,
            conflictingValues: {
              firstMutation: current.toISOString().slice(0, 10),
              subsequentMutation: next.toISOString().slice(0, 10),
            },
            recommendedAction: 'Review mutation order register (Dakhil Kharij Bahi) to restore chronological integrity.',
          };
        }
      }
    }

    // 3. OCR Document Registration Date Consistency
    if (record.documents && record.documents.length > 0) {
      for (const doc of record.documents) {
        if (doc.ocrResult?.extractedFields) {
          const ocrDateField = doc.ocrResult.extractedFields.find((f) => f.fieldName === 'registrationDate');
          if (ocrDateField && ocrDateField.fieldValue) {
            const parsedOcrDate = new Date(ocrDateField.fieldValue);
            if (!isNaN(parsedOcrDate.getTime()) && parsedOcrDate > now) {
              return {
                ruleCode: this.ruleCode,
                name: this.name,
                category: this.category,
                passed: false,
                severity: 'CRITICAL',
                title: 'Future Registration Date in Document Scan',
                explanation: `Scanned deed extracted registration date (${ocrDateField.fieldValue}) occurs in the future.`,
                conflictingValues: {
                  expected: 'Valid past or present date',
                  ocrExtracted: ocrDateField.fieldValue,
                },
                recommendedAction: 'Verify document seal authenticity with Sub-Registrar Office.',
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
      title: 'Date Timeline Verified',
      explanation: 'All registration, mutation, and document lifecycle timestamps are valid and chronological.',
      recommendedAction: 'No action required.',
    };
  }
}
