import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../src/config/database';
import { SimilarityUtil } from '../src/services/duplicate/similarity.util';
import { DuplicateDetectorService } from '../src/services/duplicate/duplicate-detector.service';
import { ConflictService } from '../src/services/conflict.service';
import { ValidationEngine } from '../src/services/validation/validation.engine';
import { ConflictStatus, ConflictType } from '@land-digitization/shared';
import { UserRole } from '../src/constants/index';

describe('Duplicate-Record Detection & Human Resolution Engine', () => {
  let officerId: string;
  let locationId: string;
  let baseRecordId: string;
  let duplicateRecordId: string;
  let distinctRecordId: string;

  before(async () => {
    // 1. Create Officer User
    const officer = await prisma.user.create({
      data: {
        email: `officer-dup-${Date.now()}@revenue.gov.in`,
        passwordHash: 'hashed_secret',
        fullName: 'Shri Vikramaditya (Sub-Divisional Officer)',
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
        village: `DupVillage_${Date.now()}`,
        censusCode: 'DUP-001',
      },
    });
    locationId = loc.id;

    // 3. Create Base Record A
    const recA = await prisma.landRecord.create({
      data: {
        ulpin: `ULPIN-DUP-A-${Date.now()}`,
        locationId,
        khasraNumber: '142/4',
        khatauniNumber: 'KH-8821',
        areaInSqMeters: 5000,
        areaUnit: 'SQ_METERS',
        landType: 'AGRICULTURAL',
        status: 'VERIFIED',
        createdById: officerId,
        owners: {
          create: [
            {
              fullName: 'Shri Ramesh Kumar Sharma',
              shareFraction: 1.0,
              isPrimary: true,
            },
          ],
        },
      },
    });
    baseRecordId = recA.id;

    // 4. Create Duplicate Record B (with slight variants in Khasra padding, honorifics, and area within 1%)
    const recB = await prisma.landRecord.create({
      data: {
        ulpin: `ULPIN-DUP-B-${Date.now()}`,
        locationId,
        khasraNumber: 'Plot 142/04',
        khatauniNumber: 'KH-8821',
        areaInSqMeters: 5020, // 0.4% diff
        areaUnit: 'SQ_METERS',
        landType: 'AGRICULTURAL',
        status: 'DRAFT',
        createdById: officerId,
        owners: {
          create: [
            {
              fullName: 'Ramesh K Sharma',
              shareFraction: 1.0,
              isPrimary: true,
            },
          ],
        },
      },
    });
    duplicateRecordId = recB.id;

    // 5. Create Distinct Record C (different Khasra, different owner, different area)
    const recC = await prisma.landRecord.create({
      data: {
        ulpin: `ULPIN-DISTINCT-${Date.now()}`,
        locationId,
        khasraNumber: '999/8',
        khatauniNumber: 'KH-9999',
        areaInSqMeters: 12000,
        areaUnit: 'SQ_METERS',
        landType: 'COMMERCIAL',
        status: 'VERIFIED',
        createdById: officerId,
        owners: {
          create: [
            {
              fullName: 'Sunita Devi Agrawal',
              shareFraction: 1.0,
              isPrimary: true,
            },
          ],
        },
      },
    });
    distinctRecordId = recC.id;
  });

  describe('1. Normalization & Similarity Matchers', () => {
    it('should normalize Khasra numbers across variations', () => {
      assert.equal(SimilarityUtil.normalizeKhasra('Plot 142/04'), '142/4');
      assert.equal(SimilarityUtil.normalizeKhasra('Khasra 142-4'), '142/4');
      assert.equal(SimilarityUtil.normalizeKhasra(' 007 / 02 '), '7/2');
      assert.equal(SimilarityUtil.normalizeKhasra('142'), '142');
    });

    it('should calculate 100% similarity for normalized Khasra equivalents', () => {
      const score = SimilarityUtil.compareKhasra('Plot 142/04', '142-4');
      assert.equal(score, 100);
    });

    it('should calculate sub-division similarity for shared base plots', () => {
      const score = SimilarityUtil.compareKhasra('142/1', '142/2');
      assert.equal(score, 60);
    });

    it('should strip honorifics and calculate high similarity for owner name variants', () => {
      const norm1 = SimilarityUtil.normalizeOwnerName('Shri Ramesh Kumar Sharma');
      const norm2 = SimilarityUtil.normalizeOwnerName('Ramesh Kumar Sharma');
      assert.equal(norm1, norm2);

      const ownerSim = SimilarityUtil.compareOwners(
        [{ fullName: 'Shri Ramesh Kumar Sharma' }],
        [{ fullName: 'Ramesh K Sharma' }]
      );
      assert.ok(ownerSim >= 80, `Expected owner similarity >= 80, got ${ownerSim}`);
    });

    it('should calculate high score for area within 1% tolerance', () => {
      const score = SimilarityUtil.compareArea(5000, 5020);
      assert.equal(score, 100);
    });
  });

  describe('2. Multi-Vector Duplicate Detector Comparison', () => {
    it('should produce High Confidence composite score (>= 90%) for Record A and Record B', async () => {
      const recA = await prisma.landRecord.findUnique({
        where: { id: baseRecordId },
        include: { location: true, owners: true },
      });
      const recB = await prisma.landRecord.findUnique({
        where: { id: duplicateRecordId },
        include: { location: true, owners: true },
      });

      const comparison = DuplicateDetectorService.compareRecords(recA, recB);

      assert.ok(comparison.compositeScore >= 85, `Expected compositeScore >= 85, got ${comparison.compositeScore}`);
      assert.equal(comparison.confidenceLevel, 'HIGH');
      assert.ok(comparison.matchReasons.length >= 3);
      assert.equal(comparison.scoreBreakdown.khasraScore, 100);
      assert.equal(comparison.scoreBreakdown.locationScore, 100);
      assert.equal(comparison.scoreBreakdown.areaScore, 100);
    });

    it('should produce Low Confidence (< 40%) for distinct Record A and Record C', async () => {
      const recA = await prisma.landRecord.findUnique({
        where: { id: baseRecordId },
        include: { location: true, owners: true },
      });
      const recC = await prisma.landRecord.findUnique({
        where: { id: distinctRecordId },
        include: { location: true, owners: true },
      });

      const comparison = DuplicateDetectorService.compareRecords(recA, recC);
      assert.ok(comparison.compositeScore < 40, `Expected compositeScore < 40, got ${comparison.compositeScore}`);
    });
  });

  describe('3. Strict Non-Automated Merging Policy & Scanning', () => {
    it('should scan record and create candidate without modifying original records', async () => {
      const scanResult = await ConflictService.scanRecordForDuplicates(baseRecordId, officerId);

      assert.ok(scanResult.candidatesFound >= 1);

      // Verify neither record was merged or deleted
      const originalA = await prisma.landRecord.findUnique({ where: { id: baseRecordId } });
      const originalB = await prisma.landRecord.findUnique({ where: { id: duplicateRecordId } });

      assert.ok(originalA !== null, 'Record A must remain intact');
      assert.ok(originalB !== null, 'Record B must remain intact');
      assert.equal(originalA?.id, baseRecordId);
      assert.equal(originalB?.id, duplicateRecordId);
    });

    it('should scan all records globally and detect candidate pairs', async () => {
      const allScanResult = await ConflictService.scanAllRecords(locationId, officerId);
      assert.ok(allScanResult.candidatesFound >= 1);
    });
  });

  describe('4. Authorized Human Review Resolution & Audit Logging', () => {
    let candidateId: string;

    before(async () => {
      const candidates = await ConflictService.listConflicts({ landRecordId: baseRecordId });
      assert.ok(candidates.length > 0);
      candidateId = candidates[0].id;
    });

    it('should reject resolution attempt without mandatory notes', async () => {
      await assert.rejects(
        async () => {
          await ConflictService.resolveConflict(candidateId, {
            status: ConflictStatus.RESOLVED,
            resolutionNotes: '   ',
            resolvedById: officerId,
          });
        },
        /Resolution notes and reason are mandatory/
      );
    });

    it('should successfully record human determination and create immutable AuditLog entry', async () => {
      const resolved = await ConflictService.resolveConflict(candidateId, {
        status: ConflictStatus.RESOLVED,
        resolutionNotes: 'Field survey #2026-881 verified. Sub-parcel 142/4 partition legalized under mutation order #912.',
        resolvedById: officerId,
        actorRole: UserRole.REVENUE_OFFICER,
      });

      assert.equal(resolved.status, ConflictStatus.RESOLVED);
      assert.equal(resolved.resolvedById, officerId);
      assert.ok(resolved.resolvedAt !== undefined);

      // Verify AuditLog record was persisted
      const auditEntry = await prisma.auditLog.findFirst({
        where: {
          entityType: 'DuplicateCandidate',
          entityId: candidateId,
          action: 'RESOLVE_CONFLICT',
        },
        orderBy: { timestamp: 'desc' },
      });

      assert.ok(auditEntry !== null, 'AuditLog entry must be recorded');
      assert.equal(auditEntry?.actorId, officerId);
      assert.equal(auditEntry?.actorRole, UserRole.REVENUE_OFFICER);

      const diff = JSON.parse(auditEntry?.snapshotDiffJson || '{}');
      assert.equal(diff.newStatus, 'RESOLVED');
      assert.equal(diff.autoMergeBlocked, true);
    });
  });

  describe('5. Integration with Land-Record Validation Engine', () => {
    it('should flag duplicate candidate in ValidationEngine report', async () => {
      const report = await ValidationEngine.validateRecord(duplicateRecordId, officerId);

      const duplicateCheck = report.checks.find(
        (c) => c.ruleCode === 'DUPLICATE_RECORDS'
      );

      assert.ok(duplicateCheck !== undefined, 'Validation report must contain DUPLICATE_RECORDS check');
      assert.equal(duplicateCheck?.passed, false);
      assert.equal(duplicateCheck?.severity, 'CRITICAL');
    });
  });
});
