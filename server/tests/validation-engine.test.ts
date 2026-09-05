import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../src/config/database';
import { ValidationEngine } from '../src/services/validation/validation.engine';
import { ValidationRuleRegistry } from '../src/services/validation/rules/index';
import { UserRole } from '../src/constants/index';

describe('Land-Record Deterministic Validation Engine', () => {
  let officerId: string;
  let locationId: string;
  let cleanRecordId: string;
  let defectiveRecordId: string;

  before(async () => {
    // 1. Create Officer User
    const officer = await prisma.user.create({
      data: {
        email: `officer-val-${Date.now()}@revenue.gov.in`,
        passwordHash: 'hashed_secret',
        fullName: 'Shri Arvind Sharma (Tehsildar)',
        roleName: UserRole.REVENUE_OFFICER,
      },
    });
    officerId = officer.id;

    // 2. Create Location
    const loc = await prisma.location.create({
      data: {
        state: 'Rajasthan',
        district: 'Jaipur',
        tehsil: 'Sanganer',
        village: `ValVillage_${Date.now()}`,
        censusCode: 'VAL-001',
      },
    });
    locationId = loc.id;

    // 3. Create a 100% Clean LandRecord
    const cleanRecord = await prisma.landRecord.create({
      data: {
        ulpin: `ULPIN-CLEAN-${Date.now()}`,
        locationId,
        khasraNumber: '101/1',
        khatauniNumber: 'KH-101-CLEAN',
        areaInSqMeters: 4000,
        areaUnit: 'SQ_METERS',
        landType: 'AGRICULTURAL',
        status: 'VERIFIED',
        createdById: officerId,
        owners: {
          create: [
            {
              fullName: 'Ram Kumar',
              shareFraction: 0.6,
              isPrimary: true,
            },
            {
              fullName: 'Shyam Kumar',
              shareFraction: 0.4,
              isPrimary: false,
            },
          ],
        },
        documents: {
          create: {
            fileName: 'sale_deed_101_1.pdf',
            fileType: 'application/pdf',
            filePath: 'uploads/sale_deed_101_1.pdf',
            fileSize: 5000,
            fileHash: 'sha256_mock_hash_clean',
            documentType: 'REGISTRATION_DEED',
            uploadedById: officerId,
          },
        },
      },
    });
    cleanRecordId = cleanRecord.id;

    // 4. Create a Defective LandRecord (Share sum mismatch 0.7 instead of 1.0, invalid Khasra syntax, missing documents)
    const defectiveRecord = await prisma.landRecord.create({
      data: {
        ulpin: `ULPIN-DEFECT-${Date.now()}`,
        locationId,
        khasraNumber: 'INVALID_KHASRA_#99',
        khatauniNumber: 'KH-DEFECT',
        areaInSqMeters: 2500,
        areaUnit: 'SQ_METERS',
        landType: 'AGRICULTURAL',
        status: 'PENDING_VERIFICATION',
        createdById: officerId,
        owners: {
          create: [
            {
              fullName: 'Defect Titleholder',
              shareFraction: 0.7, // Deficit: only 70%
              isPrimary: false, // No primary owner
            },
          ],
        },
      },
    });
    defectiveRecordId = defectiveRecord.id;
  });

  it('1. Rule Registry has all 8 statutory validation rules registered', () => {
    const rules = ValidationRuleRegistry.getAllRules();
    assert.equal(rules.length, 8);

    const codes = rules.map((r) => r.ruleCode);
    assert.ok(codes.includes('MISSING_MANDATORY_FIELDS'));
    assert.ok(codes.includes('OWNER_MISMATCH'));
    assert.ok(codes.includes('KHASRA_SURVEY_MISMATCH'));
    assert.ok(codes.includes('AREA_MISMATCH'));
    assert.ok(codes.includes('LOCATION_MISMATCH'));
    assert.ok(codes.includes('DATE_INCONSISTENCY'));
    assert.ok(codes.includes('DUPLICATE_RECORDS'));
    assert.ok(codes.includes('INCONSISTENT_REGISTRATION_INFO'));
  });

  it('2. Evaluates clean compliant record with 100/100 score and PASSED status', async () => {
    const report = await ValidationEngine.validateRecord(cleanRecordId, officerId);

    assert.equal(report.landRecordId, cleanRecordId);
    assert.equal(report.overallScore, 100);
    assert.equal(report.status, 'PASSED');
    assert.equal(report.isValid, true);
    assert.equal(report.criticalIssuesCount, 0);
    assert.equal(report.warningIssuesCount, 0);
    assert.equal(report.failedChecksCount, 0);

    // Verify in database
    const dbResult = await prisma.validationResult.findUnique({
      where: { id: report.id },
      include: { issues: true },
    });
    assert.ok(dbResult);
    assert.equal(dbResult.overallScore, 100);
    assert.equal(dbResult.issues.length, 0);
  });

  it('3. Evaluates defective record, computes deterministic score deductions, and flags FAILED status', async () => {
    const report = await ValidationEngine.validateRecord(defectiveRecordId, officerId);

    assert.equal(report.landRecordId, defectiveRecordId);
    assert.equal(report.status, 'FAILED');
    assert.equal(report.isValid, false);
    assert.ok(report.overallScore < 75);
    assert.ok(report.criticalIssuesCount >= 2);

    // Check specific detected issues
    const issueCodes = report.issues.map((i) => i.ruleCode);
    assert.ok(issueCodes.includes('OWNER_MISMATCH'));
    assert.ok(issueCodes.includes('KHASRA_SURVEY_MISMATCH'));
    assert.ok(issueCodes.includes('INCONSISTENT_REGISTRATION_INFO'));

    // Check conflicting values payload on OWNER_MISMATCH
    const ownerIssue = report.issues.find((i) => i.ruleCode === 'OWNER_MISMATCH');
    assert.ok(ownerIssue);
    assert.ok(ownerIssue.conflictingValues);
    assert.ok(ownerIssue.conflictingValues.actual.includes('70.00%'));
    assert.ok(ownerIssue.explanation && ownerIssue.explanation.length > 10);
    assert.ok(ownerIssue.recommendedAction && ownerIssue.recommendedAction.length > 10);
  });

  it('4. Officer resolves an identified validation issue with audit remarks', async () => {
    const latest = await ValidationEngine.getLatestValidation(defectiveRecordId);
    assert.ok(latest);
    assert.ok(latest.issues.length > 0);

    const targetIssue = latest.issues[0];
    const resolveRes = await ValidationEngine.resolveIssue(
      targetIssue.id,
      officerId,
      'Verified physical survey map from Tehsil archives'
    );

    assert.equal(resolveRes.id, targetIssue.id);
    assert.equal(resolveRes.isResolved, true);
    assert.equal(resolveRes.resolvedById, officerId);

    // Check audit log
    const audit = await prisma.auditLog.findFirst({
      where: {
        entityId: targetIssue.id,
        action: 'RESOLVE_VALIDATION_ISSUE',
      },
    });
    assert.ok(audit);
    assert.equal(audit.actorId, officerId);
  });

  it('5. Retrieves validation execution history for trend analysis', async () => {
    const history = await ValidationEngine.getValidationHistory(cleanRecordId);
    assert.ok(Array.isArray(history));
    assert.ok(history.length >= 1);
    assert.equal(history[0].landRecordId, cleanRecordId);
    assert.equal(history[0].overallScore, 100);
  });
});
