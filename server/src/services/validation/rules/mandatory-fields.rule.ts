import { IValidationRule, ValidationCheckResult, ValidationContext } from './rule.interface.js';

export class MandatoryFieldsRule implements IValidationRule {
  readonly ruleCode = 'MISSING_MANDATORY_FIELDS';
  readonly name = 'Missing Mandatory Fields Check';
  readonly category = 'MANDATORY_FIELDS' as const;
  readonly defaultSeverity = 'CRITICAL' as const;
  readonly description = 'Ensures all statutory title fields (ULPIN, Khasra, Khatauni, Area, Location hierarchy, Land Type, Owners) are present and non-empty.';

  async validate(context: ValidationContext): Promise<ValidationCheckResult> {
    const { record } = context;
    const missing: string[] = [];

    const isBlank = (val: any) =>
      !val ||
      (typeof val === 'string' &&
        (val.trim() === '' || ['null', 'undefined', 'n/a', '-', 'unknown'].includes(val.trim().toLowerCase())));

    if (isBlank(record.ulpin)) missing.push('ULPIN (Unique Parcel Identification Number)');
    if (isBlank(record.khasraNumber)) missing.push('Khasra / Survey Number');
    if (isBlank(record.khatauniNumber)) missing.push('Khatauni / Account Number');
    if (!record.areaInSqMeters || record.areaInSqMeters <= 0) missing.push('Land Area (Must be > 0)');
    if (isBlank(record.landType)) missing.push('Land Classification Type');

    if (!record.location) {
      missing.push('Administrative Location Registry');
    } else {
      if (isBlank(record.location.state)) missing.push('State');
      if (isBlank(record.location.district)) missing.push('District');
      if (isBlank(record.location.tehsil)) missing.push('Tehsil / Taluk');
      if (isBlank(record.location.village)) missing.push('Village / Mauza');
    }

    if (!record.owners || record.owners.length === 0) {
      missing.push('Legal Titleholder / Owner Details');
    }

    if (missing.length > 0) {
      return {
        ruleCode: this.ruleCode,
        name: this.name,
        category: this.category,
        passed: false,
        severity: this.defaultSeverity,
        title: `Mandatory Fields Incomplete (${missing.length} missing)`,
        explanation: `The land record is missing the following required statutory attributes: ${missing.join(', ')}.`,
        conflictingValues: {
          expected: 'All 8 mandatory attributes populated with valid non-placeholder strings',
          actual: `Missing: ${missing.join(', ')}`,
        },
        recommendedAction: 'Complete the missing title attributes from verified physical revenue records before proceeding with digitization sanction.',
      };
    }

    return {
      ruleCode: this.ruleCode,
      name: this.name,
      category: this.category,
      passed: true,
      severity: 'INFO',
      title: 'Mandatory Fields Verified',
      explanation: 'All statutory title fields, location administrative hierarchy, area metrics, and owner relations are complete.',
      recommendedAction: 'No action required.',
    };
  }
}
