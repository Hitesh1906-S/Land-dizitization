import { IValidationRule } from './rule.interface.js';
import { MandatoryFieldsRule } from './mandatory-fields.rule.js';
import { OwnerMismatchRule } from './owner-mismatch.rule.js';
import { KhasraSurveyMismatchRule } from './khasra-mismatch.rule.js';
import { AreaMismatchRule } from './area-mismatch.rule.js';
import { LocationMismatchRule } from './location-mismatch.rule.js';
import { DateInconsistencyRule } from './date-inconsistency.rule.js';
import { DuplicateRecordsRule } from './duplicate-records.rule.js';
import { InconsistentRegistrationInfoRule } from './registration-inconsistency.rule.js';

export * from './rule.interface.js';
export * from './mandatory-fields.rule.js';
export * from './owner-mismatch.rule.js';
export * from './khasra-mismatch.rule.js';
export * from './area-mismatch.rule.js';
export * from './location-mismatch.rule.js';
export * from './date-inconsistency.rule.js';
export * from './duplicate-records.rule.js';
export * from './registration-inconsistency.rule.js';

export class ValidationRuleRegistry {
  private static rules: Map<string, IValidationRule> = new Map();

  static {
    // Register the 8 standard deterministic rules
    this.registerRule(new MandatoryFieldsRule());
    this.registerRule(new OwnerMismatchRule());
    this.registerRule(new KhasraSurveyMismatchRule());
    this.registerRule(new AreaMismatchRule());
    this.registerRule(new LocationMismatchRule());
    this.registerRule(new DateInconsistencyRule());
    this.registerRule(new DuplicateRecordsRule());
    this.registerRule(new InconsistentRegistrationInfoRule());
  }

  /**
   * Registers a new or custom validation rule.
   */
  public static registerRule(rule: IValidationRule): void {
    this.rules.set(rule.ruleCode, rule);
  }

  /**
   * Unregisters a validation rule by ruleCode.
   */
  public static unregisterRule(ruleCode: string): boolean {
    return this.rules.delete(ruleCode);
  }

  /**
   * Retrieves all registered validation rules.
   */
  public static getAllRules(): IValidationRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Retrieves a specific validation rule by code.
   */
  public static getRule(ruleCode: string): IValidationRule | undefined {
    return this.rules.get(ruleCode);
  }
}
