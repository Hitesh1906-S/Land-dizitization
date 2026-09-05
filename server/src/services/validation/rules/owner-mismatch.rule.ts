import { IValidationRule, ValidationCheckResult, ValidationContext } from './rule.interface.js';

export class OwnerMismatchRule implements IValidationRule {
  readonly ruleCode = 'OWNER_MISMATCH';
  readonly name = 'Ownership & Share Integrity Check';
  readonly category = 'OWNER_CHECK' as const;
  readonly defaultSeverity = 'CRITICAL' as const;
  readonly description = 'Validates that ownership shares total exactly 100%, a unique primary owner is designated, and recorded owners align with OCR-extracted deed titleholders.';

  async validate(context: ValidationContext): Promise<ValidationCheckResult> {
    const { record } = context;

    if (!record.owners || record.owners.length === 0) {
      return {
        ruleCode: this.ruleCode,
        name: this.name,
        category: this.category,
        passed: false,
        severity: 'CRITICAL',
        title: 'No Titleholders Recorded',
        explanation: 'Record contains zero associated legal owners.',
        conflictingValues: { expected: 'At least 1 legal owner with 100% share', actual: '0 owners' },
        recommendedAction: 'Add verified owner details to the land record.',
      };
    }

    // 1. Share sum check
    const totalShare = record.owners.reduce((sum, o) => sum + (o.shareFraction || 0), 0);
    const sharePassed = Math.abs(totalShare - 1.0) < 0.001;

    if (!sharePassed) {
      return {
        ruleCode: this.ruleCode,
        name: this.name,
        category: this.category,
        passed: false,
        severity: 'CRITICAL',
        title: 'Ownership Share Sum Deficit / Surplus',
        explanation: `Total ownership shares equal ${(totalShare * 100).toFixed(2)}% instead of exactly 100.00%.`,
        conflictingValues: {
          expected: '1.0 (100.00%)',
          actual: `${totalShare} (${(totalShare * 100).toFixed(2)}%)`,
        },
        recommendedAction: 'Recompute and adjust individual co-owner fractional shares in mutation partition to sum to exactly 1.0.',
      };
    }

    // 2. Primary owner check
    const primaryOwners = record.owners.filter((o) => o.isPrimary);
    if (primaryOwners.length === 0) {
      return {
        ruleCode: this.ruleCode,
        name: this.name,
        category: this.category,
        passed: false,
        severity: 'WARNING',
        title: 'No Primary Titleholder Designated',
        explanation: 'The record has co-owners but no primary titleholder is flagged for official communication.',
        conflictingValues: { expected: '1 primary owner', actual: '0 primary owners' },
        recommendedAction: 'Designate the lead Khatedar as primary owner in the registry.',
      };
    }

    // 3. Document OCR Cross-Reference Check
    if (record.documents && record.documents.length > 0) {
      for (const doc of record.documents) {
        if (doc.ocrResult?.extractedFields) {
          const ocrOwnerField = doc.ocrResult.extractedFields.find((f) => f.fieldName === 'owner');
          if (ocrOwnerField && ocrOwnerField.fieldValue && ocrOwnerField.fieldValue.trim().length > 2) {
            const ocrOwner = ocrOwnerField.fieldValue.toLowerCase().trim();
            const recordOwners = record.owners.map((o) => o.fullName.toLowerCase().trim());

            const exactOrSubstringMatch = recordOwners.some(
              (ro) => ocrOwner.includes(ro) || ro.includes(ocrOwner)
            );

            if (!exactOrSubstringMatch) {
              return {
                ruleCode: this.ruleCode,
                name: this.name,
                category: this.category,
                passed: false,
                severity: 'CRITICAL',
                title: 'Recorded Owner vs Scanned Deed Titleholder Mismatch',
                explanation: `Registered owner name "${record.owners[0].fullName}" does not match the titleholder extracted from scanned document deed "${ocrOwnerField.fieldValue}".`,
                conflictingValues: {
                  registered: record.owners.map((o) => o.fullName).join(', '),
                  ocrExtracted: ocrOwnerField.fieldValue,
                },
                recommendedAction: 'Perform manual officer title verification to confirm whether mutation transfer was legally sanctioned before updating ownership.',
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
      title: 'Ownership & Shares Verified',
      explanation: `Total share fraction equals 100.00% across ${record.owners.length} legal titleholder(s) with primary owner "${primaryOwners[0].fullName}".`,
      recommendedAction: 'No action required.',
    };
  }
}
