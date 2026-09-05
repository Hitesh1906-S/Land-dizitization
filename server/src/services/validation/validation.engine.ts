import { prisma } from '../../config/database.js';
import { NotFoundError } from '../../utils/AppError.js';
import {
  ValidationRuleRegistry,
  ValidationCheckResult,
  ValidationContext,
} from './rules/index.js';

export interface ComprehensiveValidationReport {
  id: string;
  landRecordId: string;
  isValid: boolean;
  status: 'PASSED' | 'WARNINGS' | 'FAILED';
  overallScore: number;
  totalChecksCount: number;
  passedChecksCount: number;
  failedChecksCount: number;
  criticalIssuesCount: number;
  warningIssuesCount: number;
  infoIssuesCount: number;
  summary: string;
  executedById: string;
  createdAt: string;
  checks: ValidationCheckResult[];
  issues: Array<{
    id: string;
    ruleCode: string;
    severity: 'CRITICAL' | 'WARNING' | 'INFO';
    title: string;
    description: string;
    isResolved: boolean;
    conflictingValues?: any;
    explanation?: string;
    recommendedAction?: string;
    resolvedById?: string | null;
    resolvedAt?: string | null;
  }>;
}

export class ValidationEngine {
  /**
   * Executes the full deterministic validation engine across all registered rules for a given land record.
   */
  static async validateRecord(
    recordId: string,
    executedById?: string
  ): Promise<ComprehensiveValidationReport> {
    const record = await prisma.landRecord.findUnique({
      where: { id: recordId },
      include: {
        location: true,
        owners: true,
        parcel: true,
        documents: {
          include: {
            ocrResult: {
              include: { extractedFields: true },
            },
          },
        },
        ownershipHistory: {
          orderBy: { mutationDate: 'desc' },
        },
      },
    });

    if (!record) {
      throw new NotFoundError(`Land record with ID ${recordId} not found`);
    }

    const validExecutorId = executedById || record.createdById;
    const context: ValidationContext = { record: record as any };

    // 1. Execute all rules in registry
    const rules = ValidationRuleRegistry.getAllRules();
    const checkResults: ValidationCheckResult[] = [];

    for (const rule of rules) {
      const res = await rule.validate(context);
      checkResults.push(res);
    }

    // 2. Aggregate counts & scores
    const failedChecks = checkResults.filter((c) => !c.passed);
    const criticalIssues = failedChecks.filter((c) => c.severity === 'CRITICAL');
    const warningIssues = failedChecks.filter((c) => c.severity === 'WARNING');
    const infoIssues = failedChecks.filter((c) => c.severity === 'INFO');

    // Deterministic Score Deduction Formula:
    // Base: 100
    // Each Critical: -25 pts
    // Each Warning: -10 pts
    let score = 100 - (criticalIssues.length * 25 + warningIssues.length * 10);
    score = Math.max(0, Math.min(100, score));

    const isValid = criticalIssues.length === 0 && failedChecks.length === 0;
    const status: 'PASSED' | 'WARNINGS' | 'FAILED' =
      criticalIssues.length > 0 || score < 75
        ? 'FAILED'
        : warningIssues.length > 0
        ? 'WARNINGS'
        : 'PASSED';

    const summary =
      status === 'PASSED'
        ? `All ${rules.length} statutory checks passed successfully (Score: 100/100). Title is mathematically and legally compliant.`
        : status === 'WARNINGS'
        ? `Passed with ${warningIssues.length} warning(s) (Score: ${score}/100). Minor title deviations detected that require officer review.`
        : `Validation FAILED with ${criticalIssues.length} critical defect(s) and ${warningIssues.length} warning(s) (Score: ${score}/100). Title cannot be certified until defects are rectified.`;

    // 3. Persist ValidationResult in PostgreSQL
    const savedResult = await prisma.validationResult.create({
      data: {
        landRecordId: record.id,
        isValid,
        overallScore: score,
        summary,
        executedById: validExecutorId,
      },
    });

    // 4. Persist granular ValidationIssues
    const savedIssues = [];
    for (const check of failedChecks) {
      const detailsPayload = {
        conflictingValues: check.conflictingValues,
        explanation: check.explanation,
        recommendedAction: check.recommendedAction,
        category: check.category,
      };

      const issue = await prisma.validationIssue.create({
        data: {
          validationResultId: savedResult.id,
          ruleCode: check.ruleCode,
          severity: check.severity,
          title: check.title,
          description: check.explanation,
          detailsJson: JSON.stringify(detailsPayload),
          isResolved: false,
        },
      });

      savedIssues.push({
        id: issue.id,
        ruleCode: issue.ruleCode,
        severity: check.severity,
        title: issue.title,
        description: check.explanation,
        isResolved: false,
        conflictingValues: check.conflictingValues,
        explanation: check.explanation,
        recommendedAction: check.recommendedAction,
        resolvedById: null,
        resolvedAt: null,
      });
    }

    // 5. Immutable Audit Log
    await prisma.auditLog.create({
      data: {
        actorId: validExecutorId,
        actorRole: 'REVENUE_OFFICER',
        action: 'EXECUTE_VALIDATION',
        entityType: 'ValidationResult',
        entityId: savedResult.id,
        snapshotDiffJson: JSON.stringify({
          landRecordId: record.id,
          score,
          status,
          criticalCount: criticalIssues.length,
          warningCount: warningIssues.length,
          totalChecks: rules.length,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    return {
      id: savedResult.id,
      landRecordId: record.id,
      isValid,
      status,
      overallScore: score,
      totalChecksCount: rules.length,
      passedChecksCount: checkResults.filter((c) => c.passed).length,
      failedChecksCount: failedChecks.length,
      criticalIssuesCount: criticalIssues.length,
      warningIssuesCount: warningIssues.length,
      infoIssuesCount: infoIssues.length,
      summary,
      executedById: validExecutorId,
      createdAt: savedResult.createdAt.toISOString(),
      checks: checkResults,
      issues: savedIssues,
    };
  }

  /**
   * Retrieves the latest validation report with all granular issues for a record.
   */
  static async getLatestValidation(recordId: string): Promise<ComprehensiveValidationReport | null> {
    const latest = await prisma.validationResult.findFirst({
      where: { landRecordId: recordId },
      orderBy: { createdAt: 'desc' },
      include: { issues: true },
    });

    if (!latest) {
      return null;
    }

    const issues = latest.issues.map((i) => {
      let meta: any = {};
      try {
        meta = i.detailsJson ? JSON.parse(i.detailsJson) : {};
      } catch (e) {}

      return {
        id: i.id,
        ruleCode: i.ruleCode,
        severity: i.severity as any,
        title: i.title,
        description: i.description,
        isResolved: i.isResolved,
        conflictingValues: meta.conflictingValues,
        explanation: meta.explanation || i.description,
        recommendedAction: meta.recommendedAction,
        resolvedById: i.resolvedById,
        resolvedAt: i.resolvedAt ? i.resolvedAt.toISOString() : null,
      };
    });

    const criticalCount = issues.filter((i) => i.severity === 'CRITICAL' && !i.isResolved).length;
    const warningCount = issues.filter((i) => i.severity === 'WARNING' && !i.isResolved).length;

    const status: 'PASSED' | 'WARNINGS' | 'FAILED' =
      criticalCount > 0 || latest.overallScore < 75
        ? 'FAILED'
        : warningCount > 0
        ? 'WARNINGS'
        : 'PASSED';

    return {
      id: latest.id,
      landRecordId: latest.landRecordId,
      isValid: latest.isValid,
      status,
      overallScore: latest.overallScore,
      totalChecksCount: 8,
      passedChecksCount: 8 - issues.filter((i) => !i.isResolved).length,
      failedChecksCount: issues.filter((i) => !i.isResolved).length,
      criticalIssuesCount: criticalCount,
      warningIssuesCount: warningCount,
      infoIssuesCount: issues.filter((i) => i.severity === 'INFO').length,
      summary: latest.summary || '',
      executedById: latest.executedById,
      createdAt: latest.createdAt.toISOString(),
      checks: [],
      issues,
    };
  }

  /**
   * Resolves a specific validation issue with officer resolution notes.
   */
  static async resolveIssue(
    issueId: string,
    officerId: string,
    resolutionNotes: string
  ): Promise<any> {
    const issue = await prisma.validationIssue.findUnique({
      where: { id: issueId },
      include: { validationResult: true },
    });

    if (!issue) {
      throw new NotFoundError(`Validation issue with ID ${issueId} not found`);
    }

    const updated = await prisma.validationIssue.update({
      where: { id: issueId },
      data: {
        isResolved: true,
        resolvedById: officerId,
        resolvedAt: new Date(),
      },
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        actorId: officerId,
        actorRole: 'REVENUE_OFFICER',
        action: 'RESOLVE_VALIDATION_ISSUE',
        entityType: 'ValidationIssue',
        entityId: issueId,
        snapshotDiffJson: JSON.stringify({
          ruleCode: issue.ruleCode,
          resolutionNotes,
          resolvedAt: new Date().toISOString(),
        }),
      },
    });

    return {
      id: updated.id,
      ruleCode: updated.ruleCode,
      isResolved: updated.isResolved,
      resolvedById: updated.resolvedById,
      resolvedAt: updated.resolvedAt?.toISOString(),
      resolutionNotes,
    };
  }

  /**
   * Retrieves historical validation execution history for trend analysis.
   */
  static async getValidationHistory(recordId: string): Promise<any[]> {
    const results = await prisma.validationResult.findMany({
      where: { landRecordId: recordId },
      orderBy: { createdAt: 'desc' },
      include: {
        issues: true,
      },
      take: 10,
    });

    return results.map((r) => ({
      id: r.id,
      landRecordId: r.landRecordId,
      overallScore: r.overallScore,
      isValid: r.isValid,
      summary: r.summary,
      executedById: r.executedById,
      issuesCount: r.issues.length,
      createdAt: r.createdAt.toISOString(),
    }));
  }
}
