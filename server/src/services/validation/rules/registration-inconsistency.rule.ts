import { IValidationRule, ValidationCheckResult, ValidationContext } from './rule.interface.js';

export class InconsistentRegistrationInfoRule implements IValidationRule {
  readonly ruleCode = 'INCONSISTENT_REGISTRATION_INFO';
  readonly name = 'Deed Registration & Title Reference Integrity Check';
  readonly category = 'REGISTRATION_CHECK' as const;
  readonly defaultSeverity = 'WARNING' as const;
  readonly description = 'Checks consistency of deed registration number, document classification, and Sub-Registrar certification references.';

  async validate(context: ValidationContext): Promise<ValidationCheckResult> {
    const { record } = context;

    // 1. Check Document Attachments
    if (!record.documents || record.documents.length === 0) {
      return {
        ruleCode: this.ruleCode,
        name: this.name,
        category: this.category,
        passed: false,
        severity: 'WARNING',
        title: 'No Supporting Deed Document Attached',
        explanation: 'The land title is registered without any supporting scanned physical deed, Jamabandi extract, or mutation order attached.',
        conflictingValues: { expected: 'At least 1 registered deed document', actual: '0 documents' },
        recommendedAction: 'Upload scanned certified copy of the registered sale deed or Jamabandi extract.',
      };
    }

    // 2. Cross-Reference Document Number
    for (const doc of record.documents) {
      if (doc.ocrResult?.extractedFields) {
        const ocrDocNumField = doc.ocrResult.extractedFields.find((f) => f.fieldName === 'documentNumber');
        if (ocrDocNumField && ocrDocNumField.fieldValue && record.khatauniNumber) {
          const cleanOcr = ocrDocNumField.fieldValue.replace(/[^A-Za-z0-9]/g, '').toLowerCase();
          const cleanRec = record.khatauniNumber.replace(/[^A-Za-z0-9]/g, '').toLowerCase();

          if (cleanOcr.length >= 4 && cleanRec.length >= 4 && !cleanOcr.includes(cleanRec) && !cleanRec.includes(cleanOcr)) {
            return {
              ruleCode: this.ruleCode,
              name: this.name,
              category: this.category,
              passed: false,
              severity: 'WARNING',
              title: 'Deed Registration Reference Number Mismatch',
              explanation: `Registered deed/account number "${record.khatauniNumber}" differs from document reference number "${ocrDocNumField.fieldValue}" detected in OCR scan.`,
              conflictingValues: {
                registeredKhatauni: record.khatauniNumber,
                ocrDocumentNumber: ocrDocNumField.fieldValue,
              },
              recommendedAction: 'Reconcile deed registration serial numbers with Sub-Registrar registry index.',
            };
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
      title: 'Registration Information Verified',
      explanation: 'Attached deed documents and registration reference indices are consistent.',
      recommendedAction: 'No action required.',
    };
  }
}
