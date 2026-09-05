import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../src/config/database';
import { OfficerService } from '../src/services/officer.service';
import { RecordStatus, AuditAction, ConflictType, ConflictStatus, UserRole } from '@land-digitization/shared';

describe('Officer Portal & Dashboard Real Database Workflows', () => {
  let testOfficerId: string;
  let testLocationId: string;
  let testRecordId1: string;
  let testRecordId2: string;
  let testDocumentId: string;
  let testOcrResultId: string;
  let testFieldId: string;
  let testIssueId: string;
  let testCandidateId: string;

  before(async () => {
    // 1. Create a Test Officer User
    const officer = await prisma.user.create({
      data: {
        email: `officer_test_${Date.now()}@bhoomisetu.gov.in`,
        passwordHash: 'hashed_pw',
        fullName: 'Shri Vikramaditya Rathore',
        roleName: UserRole.REVENUE_OFFICER,
        jurisdictionDistrict: 'Jaipur',
        jurisdictionTehsil: 'Sanganer',
      },
    });
    testOfficerId = officer.id;

    // 2. Create a Test Location
    const location = await prisma.location.create({
      data: {
        state: 'Rajasthan',
        district: 'Jaipur',
        tehsil: 'Sanganer',
        village: `OfficerTestVillage_${Date.now()}`,
      },
    });
    testLocationId = location.id;

    // 3. Create Record 1 (Pending Verification)
    const record1 = await prisma.landRecord.create({
      data: {
        ulpin: `RJ-TEST-OFF-${Date.now().toString().slice(-6)}`,
        khasraNumber: '701/1',
        khatauniNumber: 'KH-8801',
        locationId: testLocationId,
        areaInSqMeters: 4500,
        status: RecordStatus.PENDING_VERIFICATION,
        createdById: testOfficerId,
        owners: {
          create: [
            {
              fullName: 'Bhairav Singh Shekhawat',
              relationType: 'S/O',
              guardianName: 'Guman Singh',
              shareFraction: 1.0,
              isPrimary: true,
            },
          ],
        },
      },
    });
    testRecordId1 = record1.id;

    // 4. Create Record 2 (Verified)
    const record2 = await prisma.landRecord.create({
      data: {
        ulpin: `RJ-TEST-OFF-${(Date.now() + 1).toString().slice(-6)}`,
        khasraNumber: '701/2',
        khatauniNumber: 'KH-8802',
        locationId: testLocationId,
        areaInSqMeters: 5000,
        status: RecordStatus.VERIFIED,
        createdById: testOfficerId,
        owners: {
          create: [
            {
              fullName: 'Kalyan Singh Shekhawat',
              relationType: 'S/O',
              guardianName: 'Guman Singh',
              shareFraction: 1.0,
              isPrimary: true,
            },
          ],
        },
      },
    });
    testRecordId2 = record2.id;

    // 5. Create Scanned Document with OCR and Extracted Fields
    const document = await prisma.document.create({
      data: {
        landRecordId: testRecordId1,
        fileName: 'test_registered_deed_701.pdf',
        fileType: 'application/pdf',
        filePath: 'uploads/test_deed.pdf',
        fileSize: 102400,
        fileHash: `hash_${Date.now()}`,
        documentType: 'REGISTRATION_DEED',
        uploadedById: testOfficerId,
      },
    });
    testDocumentId = document.id;

    const ocrResult = await prisma.oCRResult.create({
      data: {
        documentId: testDocumentId,
        status: 'COMPLETED',
        rawText: 'Sale deed of Khasra 701/1 in village Jaipur for Bhairav Singh',
        confidenceScore: 0.72,
        engine: 'HYBRID',
      },
    });
    testOcrResultId = ocrResult.id;

    const extractedField = await prisma.extractedField.create({
      data: {
        ocrResultId: testOcrResultId,
        fieldName: 'ownerName',
        fieldValue: 'Bhairav Sing',
        confidence: 0.68,
        isVerified: false,
      },
    });
    testFieldId = extractedField.id;

    // 6. Create Validation Result & Issue
    const valResult = await prisma.validationResult.create({
      data: {
        landRecordId: testRecordId1,
        isValid: false,
        overallScore: 70,
        summary: 'Area discrepancy detected',
        executedById: testOfficerId,
      },
    });

    const valIssue = await prisma.validationIssue.create({
      data: {
        validationResultId: valResult.id,
        ruleCode: 'AREA_DEVIATION',
        severity: 'WARNING',
        title: 'Area deviation between deed and title registry',
        description: 'Document indicates 4400 m² while registry is 4500 m²',
        isResolved: false,
      },
    });
    testIssueId = valIssue.id;

    // 7. Create Duplicate Candidate
    const candidate = await prisma.duplicateCandidate.create({
      data: {
        primaryRecordId: testRecordId1,
        conflictingRecordId: testRecordId2,
        conflictType: ConflictType.FUZZY_MATCH,
        status: ConflictStatus.OPEN,
        resolutionNotes: 'Potential family co-ownership overlap',
      },
    });
    testCandidateId = candidate.id;
  });

  after(async () => {
    // Cleanup fixtures
    try {
      await prisma.duplicateCandidate.deleteMany({
        where: { id: testCandidateId },
      });
      await prisma.validationIssue.deleteMany({
        where: { id: testIssueId },
      });
      await prisma.validationResult.deleteMany({
        where: { landRecordId: { in: [testRecordId1, testRecordId2] } },
      });
      await prisma.extractedField.deleteMany({
        where: { ocrResultId: testOcrResultId },
      });
      await prisma.oCRResult.deleteMany({
        where: { id: testOcrResultId },
      });
      await prisma.document.deleteMany({
        where: { id: testDocumentId },
      });
      await prisma.owner.deleteMany({
        where: { landRecordId: { in: [testRecordId1, testRecordId2] } },
      });
      await prisma.landRecord.deleteMany({
        where: { id: { in: [testRecordId1, testRecordId2] } },
      });
      await prisma.location.deleteMany({
        where: { id: testLocationId },
      });
      await prisma.auditLog.deleteMany({
        where: { actorId: testOfficerId },
      });
      await prisma.user.deleteMany({
        where: { id: testOfficerId },
      });
    } catch {
      // Ignore cleanup error
    }
  });

  describe('1. Real Database Dashboard Stats Aggregation', () => {
    it('should aggregate real-time counts across all tables', async () => {
      const stats = await OfficerService.getDashboardStats();

      assert.ok(stats.totalRecords >= 2, 'Total records must be >= 2');
      assert.ok(stats.digitized >= 1, 'Digitized records must be >= 1');
      assert.ok(stats.verified >= 1, 'Verified records must be >= 1');
      assert.ok(stats.pending >= 1, 'Pending records must be >= 1');
      assert.ok(stats.conflicts >= 1, 'Conflicts must be >= 1');
      assert.ok(stats.duplicates >= 1, 'Duplicates must be >= 1');
    });
  });

  describe('2. Operational Queues Retrieval', () => {
    it('should retrieve pending verification queue with relations', async () => {
      const queue = await OfficerService.getPendingVerificationQueue({ limit: 50 });

      assert.ok(queue.items.length >= 1);
      const target = queue.items.find((i) => i.id === testRecordId1);
      assert.ok(target !== undefined, 'Test record 1 must be present in pending queue');
      assert.equal(target?.status, RecordStatus.PENDING_VERIFICATION);
      assert.equal(target?.khasraNumber, '701/1');
      assert.ok(target?.location !== undefined);
      assert.ok(target?.owners && target.owners.length >= 1);
    });

    it('should retrieve low-confidence OCR queue', async () => {
      const queue = await OfficerService.getLowConfidenceOcrQueue({ threshold: 0.85 });

      assert.ok(queue.items.length >= 1);
      const target = queue.items.find((i) => i.ocrResultId === testOcrResultId);
      assert.ok(target !== undefined, 'Target low-confidence OCR item must exist');
      assert.ok(target?.confidenceScore < 0.85);
      assert.ok(target?.extractedFields.length >= 1);
    });

    it('should retrieve validation conflicts queue', async () => {
      const queue = await OfficerService.getValidationConflictsQueue({ limit: 100 });

      assert.ok(queue.items.length >= 1);
      const target = queue.items.find((i) => i.id === testIssueId);
      assert.ok(target !== undefined, 'Target validation issue must exist');
      assert.equal(target?.ruleCode, 'AREA_DEVIATION');
      assert.equal(target?.isResolved, false);
    });

    it('should retrieve duplicate candidates queue', async () => {
      const queue = await OfficerService.getDuplicateCandidatesQueue({ limit: 100 });

      assert.ok(queue.items.length >= 1);
      const target = queue.items.find((i) => i.id === testCandidateId);
      assert.ok(target !== undefined, 'Target duplicate candidate must exist');
      assert.equal(target?.status, ConflictStatus.OPEN);
    });

    it('should retrieve recent activity audit logs', async () => {
      const logs = await OfficerService.getRecentActivity({ limit: 20 });
      assert.ok(Array.isArray(logs));
    });
  });

  describe('3. Officer Actions & Immutable Audit Trail', () => {
    it('should approve land record and record AuditLog event', async () => {
      const approved = await OfficerService.approveRecord(
        testRecordId1,
        testOfficerId,
        'Approved after physical survey verification'
      );

      assert.equal(approved.status, RecordStatus.VERIFIED);

      // Verify Audit Log
      const auditEntry = await prisma.auditLog.findFirst({
        where: {
          actorId: testOfficerId,
          entityId: testRecordId1,
          action: AuditAction.VERIFY,
        },
      });

      assert.ok(auditEntry !== null, 'An audit log must be created on record approval');
      assert.equal(auditEntry?.actorRole, 'REVENUE_OFFICER');
      assert.ok(auditEntry?.snapshotDiffJson?.includes('OFFICER_APPROVE_RECORD'));
    });

    it('should reject land record with mandatory reason and create AuditLog', async () => {
      const rejected = await OfficerService.rejectRecord(
        testRecordId1,
        testOfficerId,
        'Disputed due to contradictory sale deed boundary claims'
      );

      assert.equal(rejected.status, RecordStatus.DISPUTED);

      const auditEntry = await prisma.auditLog.findFirst({
        where: {
          actorId: testOfficerId,
          entityId: testRecordId1,
          action: AuditAction.REJECT_MUTATION,
        },
      });

      assert.ok(auditEntry !== null, 'An audit log must be created on record rejection');
      assert.ok(auditEntry?.snapshotDiffJson?.includes('contradictory sale deed'));
    });

    it('should resolve validation issue and create AuditLog', async () => {
      const resolved = await OfficerService.resolveValidationIssue(
        testIssueId,
        testOfficerId,
        'Surveyor verified deed area matches boundary demarcations'
      );

      assert.equal(resolved.isResolved, true);

      const auditEntry = await prisma.auditLog.findFirst({
        where: {
          actorId: testOfficerId,
          entityId: testIssueId,
          action: AuditAction.RESOLVE_CONFLICT,
        },
      });

      assert.ok(auditEntry !== null, 'Audit log must be created for issue resolution');
    });

    it('should run deterministic validation engine on demand', async () => {
      const valResult = await OfficerService.runValidation(testRecordId1, testOfficerId);

      assert.ok(valResult !== undefined);
      assert.ok(typeof valResult.overallScore === 'number');

      const auditEntry = await prisma.auditLog.findFirst({
        where: {
          actorId: testOfficerId,
          entityId: testRecordId1,
          entityType: 'LandRecordValidation',
        },
      });

      assert.ok(auditEntry !== null, 'Audit log must record on-demand validation');
    });
  });
});
