import { IValidationRule, ValidationCheckResult, ValidationContext } from './rule.interface.js';

export class LocationMismatchRule implements IValidationRule {
  readonly ruleCode = 'LOCATION_MISMATCH';
  readonly name = 'Administrative Jurisdiction & Location Consistency Check';
  readonly category = 'LOCATION_CHECK' as const;
  readonly defaultSeverity = 'CRITICAL' as const;
  readonly description = 'Validates administrative jurisdiction hierarchy (State -> District -> Tehsil -> Village) and checks consistency with deed OCR location.';

  async validate(context: ValidationContext): Promise<ValidationCheckResult> {
    const { record } = context;

    if (!record.location) {
      return {
        ruleCode: this.ruleCode,
        name: this.name,
        category: this.category,
        passed: false,
        severity: 'CRITICAL',
        title: 'Missing Administrative Location Hierarchy',
        explanation: 'Record is not linked to any registered State/District/Tehsil/Village jurisdiction entry.',
        conflictingValues: { expected: 'Valid Location ID in database', actual: null },
        recommendedAction: 'Associate the land record with an official revenue village location entry.',
      };
    }

    const { state, district, tehsil, village } = record.location;

    // Cross-Reference against Document OCR Extraction
    if (record.documents && record.documents.length > 0) {
      for (const doc of record.documents) {
        if (doc.ocrResult?.extractedFields) {
          const ocrVillageField = doc.ocrResult.extractedFields.find((f) => f.fieldName === 'village');
          if (ocrVillageField && ocrVillageField.fieldValue && ocrVillageField.fieldValue.trim().length > 1) {
            const ocrVillage = ocrVillageField.fieldValue.toLowerCase().trim();
            const recVillage = village.toLowerCase().trim();

            if (!ocrVillage.includes(recVillage) && !recVillage.includes(ocrVillage)) {
              return {
                ruleCode: this.ruleCode,
                name: this.name,
                category: this.category,
                passed: false,
                severity: 'CRITICAL',
                title: 'Village Jurisdiction Mismatch',
                explanation: `Registered village "${village}" differs from village "${ocrVillageField.fieldValue}" extracted from the deed scan.`,
                conflictingValues: {
                  registered: `${village}, ${tehsil}, ${district}, ${state}`,
                  ocrExtracted: ocrVillageField.fieldValue,
                },
                recommendedAction: 'Verify the correct Revenue Circle / Village code before sanctioning digital title.',
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
      title: 'Administrative Location Verified',
      explanation: `Location is verified under jurisdiction: Village ${village}, Tehsil ${tehsil}, District ${district}, State ${state}.`,
      recommendedAction: 'No action required.',
    };
  }
}
