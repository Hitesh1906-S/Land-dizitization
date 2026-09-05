import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../src/config/database';
import { AdminService } from '../src/services/admin.service';
import { UserRole, RecordStatus, RequestStage, AuditAction } from '@land-digitization/shared';

describe('Administrator Portal & System Governance Workflows', () => {
  let testAdminId: string;
  let testOfficerId: string;
  let testCitizenId: string;
  let testLocationId: string;
  let testRecordId: string;
  let testRequestId: string;
  let testRoleId: string;

  before(async () => {
    // 1. Create Test Admin
    const admin = await prisma.user.create({
      data: {
        email: `admin_test_${Date.now()}@bhoomisetu.gov.in`,
        passwordHash: 'hashed_admin_pw',
        fullName: 'Chief Land Administrator',
        roleName: UserRole.ADMIN,
      },
    });
    testAdminId = admin.id;

    // 2. Create Test Officer
    const officer = await prisma.user.create({
      data: {
        email: `officer_admin_test_${Date.now()}@bhoomisetu.gov.in`,
        passwordHash: 'hashed_officer_pw',
        fullName: 'Tehsildar Surendra Pal',
        roleName: UserRole.REVENUE_OFFICER,
        jurisdictionDistrict: 'Jaipur',
        jurisdictionTehsil: 'Sanganer',
      },
    });
    testOfficerId = officer.id;

    // 3. Create Test Citizen
    const citizen = await prisma.user.create({
      data: {
        email: `citizen_admin_test_${Date.now()}@gmail.com`,
        passwordHash: 'hashed_citizen_pw',
        fullName: 'Gajendra Meena',
        roleName: UserRole.CITIZEN,
      },
    });
    testCitizenId = citizen.id;

    // 4. Create Test Location
    const location = await prisma.location.create({
      data: {
        state: 'Rajasthan',
        district: 'Jaipur',
        tehsil: 'Sanganer',
        village: `AdminTestVillage_${Date.now()}`,
      },
    });
    testLocationId = location.id;

    // 5. Create Test Record
    const record = await prisma.landRecord.create({
      data: {
        ulpin: `RJ-ADMIN-${Date.now().toString().slice(-6)}`,
        khasraNumber: '991/1',
        khatauniNumber: 'KH-9901',
        locationId: testLocationId,
        areaInSqMeters: 6200,
        status: RecordStatus.PENDING_VERIFICATION,
        createdById: testAdminId,
        owners: {
          create: [
            {
              fullName: 'Gajendra Meena',
              shareFraction: 1.0,
              isPrimary: true,
            },
          ],
        },
      },
    });
    testRecordId = record.id;

    // 6. Create Test Request
    const req = await prisma.request.create({
      data: {
        applicationNumber: `MUT-ADMIN-${Date.now().toString().slice(-6)}`,
        applicantId: testCitizenId,
        landRecordId: testRecordId,
        requestType: 'SALE_MUTATION',
        stage: RequestStage.SUBMITTED,
      },
    });
    testRequestId = req.id;

    // 7. Fetch a Role ID
    let role = await prisma.role.findFirst({ where: { name: UserRole.REVENUE_OFFICER } });
    if (!role) {
      role = await prisma.role.create({
        data: {
          name: UserRole.REVENUE_OFFICER,
          description: 'Jurisdiction Revenue Officer',
          permissions: JSON.stringify(['RECORDS_VERIFY', 'VALIDATION_RUN']),
        },
      });
    }
    testRoleId = role.id;
  });

  after(async () => {
    // Cleanup fixtures
    try {
      await prisma.request.deleteMany({ where: { id: testRequestId } });
      await prisma.owner.deleteMany({ where: { landRecordId: testRecordId } });
      await prisma.landRecord.deleteMany({ where: { id: testRecordId } });
      await prisma.location.deleteMany({ where: { id: testLocationId } });
      await prisma.auditLog.deleteMany({
        where: { actorId: { in: [testAdminId, testOfficerId, testCitizenId] } },
      });
      await prisma.user.deleteMany({
        where: { id: { in: [testAdminId, testOfficerId, testCitizenId] } },
      });
    } catch {
      // Ignore
    }
  });

  describe('1. Real Database Dashboard Stats & Metrics', () => {
    it('should aggregate system-wide counts across PostgreSQL tables', async () => {
      const stats = await AdminService.getDashboardStats();

      assert.ok(stats.totalUsers >= 3);
      assert.ok(stats.activeUsers >= 3);
      assert.ok(stats.totalOfficers >= 1);
      assert.ok(stats.totalCitizens >= 1);
      assert.ok(stats.totalAdmins >= 1);
      assert.ok(stats.totalRecords >= 1);
      assert.ok(stats.totalRequests >= 1);
    });
  });

  describe('2. User Management & Sensitive Field Protection', () => {
    let createdUserId: string;

    it('should create new user with hashed password and audit entry', async () => {
      const email = `new_officer_${Date.now()}@bhoomisetu.gov.in`;
      const newUser = await AdminService.createUser(
        {
          email,
          password: 'securePassword123!',
          fullName: 'Smt Anita Choudhary',
          role: UserRole.REVENUE_OFFICER,
          jurisdictionDistrict: 'Jaipur',
          jurisdictionTehsil: 'Chaksu',
        },
        testAdminId
      );

      createdUserId = newUser.id;
      assert.ok(newUser.id);
      assert.equal(newUser.email, email);
      assert.equal(newUser.role, UserRole.REVENUE_OFFICER);

      // Verify audit log
      const audit = await prisma.auditLog.findFirst({
        where: {
          actorId: testAdminId,
          entityId: newUser.id,
          action: AuditAction.CREATE,
        },
      });
      assert.ok(audit !== null);
    });

    it('should retrieve users list strictly without passwordHash', async () => {
      const res = await AdminService.getUsers({ limit: 50 });

      assert.ok(res.users.length >= 1);
      for (const u of res.users) {
        assert.equal((u as any).passwordHash, undefined, 'passwordHash must never be exposed');
        assert.ok(u.email);
        assert.ok(u.role);
        assert.ok(u.metrics !== undefined);
      }
    });

    it('should update user and toggle active status with audit logging', async () => {
      const updated = await AdminService.updateUser(
        createdUserId,
        {
          fullName: 'Smt Anita Choudhary (Promoted)',
          jurisdictionTehsil: 'Sanganer',
        },
        testAdminId
      );

      assert.equal(updated.fullName, 'Smt Anita Choudhary (Promoted)');
      assert.equal(updated.jurisdictionTehsil, 'Sanganer');

      const toggled = await AdminService.toggleUserStatus(createdUserId, testAdminId);
      assert.equal(toggled.isActive, false);

      // Clean up created user
      await prisma.user.delete({ where: { id: createdUserId } });
    });
  });

  describe('3. Role Management & Permission Matrices', () => {
    it('should list system roles with user counts and permissions', async () => {
      const roles = await AdminService.getRoles();

      assert.ok(roles.length >= 1);
      const targetRole = roles.find((r) => r.id === testRoleId);
      assert.ok(targetRole !== undefined);
      assert.ok(Array.isArray(targetRole?.permissions));
    });

    it('should update role permissions and record audit log', async () => {
      const newPerms = ['RECORDS_VERIFY', 'VALIDATION_RUN', 'ADMIN_AUDIT_VIEW'];
      const updated = await AdminService.updateRolePermissions(
        testRoleId,
        newPerms,
        'Updated revenue officer capabilities',
        testAdminId
      );

      assert.ok(updated.permissions.includes('ADMIN_AUDIT_VIEW'));

      const audit = await prisma.auditLog.findFirst({
        where: {
          actorId: testAdminId,
          entityId: testRoleId,
          action: AuditAction.UPDATE,
        },
      });
      assert.ok(audit !== null);
    });
  });

  describe('4. Land-Record Governance & Executive Overrides', () => {
    it('should retrieve paginated master records with filters', async () => {
      const res = await AdminService.getRecords({ limit: 50 });

      assert.ok(res.records.length >= 1);
      const target = res.records.find((r) => r.id === testRecordId);
      assert.ok(target !== undefined);
      assert.equal(target?.khasraNumber, '991/1');
    });

    it('should override record status and log administrative audit event', async () => {
      const updated = await AdminService.updateRecordStatus(
        testRecordId,
        RecordStatus.VERIFIED,
        'Executive sanction granted by Chief Administrator',
        testAdminId
      );

      assert.equal(updated.status, RecordStatus.VERIFIED);

      const audit = await prisma.auditLog.findFirst({
        where: {
          actorId: testAdminId,
          entityId: testRecordId,
          entityType: 'LandRecordStatusOverride',
        },
      });
      assert.ok(audit !== null);
      assert.ok(audit?.snapshotDiffJson?.includes('Executive sanction granted'));
    });
  });

  describe('5. Request Governance & Officer Assignment', () => {
    it('should list mutation requests with applicant and document details', async () => {
      const res = await AdminService.getRequests({ limit: 50 });

      assert.ok(res.requests.length >= 1);
      const target = res.requests.find((r) => r.id === testRequestId);
      assert.ok(target !== undefined);
      assert.equal(target?.applicant?.id, testCitizenId);
    });

    it('should assign Revenue Officer to mutation request and log audit trail', async () => {
      const updated = await AdminService.assignOfficer(testRequestId, testOfficerId, testAdminId);

      assert.equal(updated.assignedOfficerId, testOfficerId);

      const audit = await prisma.auditLog.findFirst({
        where: {
          actorId: testAdminId,
          entityId: testRequestId,
          entityType: 'RequestOfficerAssignment',
        },
      });
      assert.ok(audit !== null);
    });
  });

  describe('6. Validation Monitoring & Audit Trail', () => {
    it('should aggregate validation metrics', async () => {
      const metrics = await AdminService.getValidationMetrics();

      assert.ok(typeof metrics.totalValidations === 'number');
      assert.ok(typeof metrics.passRatePercentage === 'number');
      assert.ok(Array.isArray(metrics.topTriggeredRules));
    });

    it('should query server-side paginated audit trail logs', async () => {
      const res = await AdminService.getAuditLogs({ limit: 50 });

      assert.ok(res.logs.length >= 1);
      for (const log of res.logs) {
        assert.ok(log.action);
        assert.ok(log.entityType);
        assert.ok(log.actor);
      }
    });
  });
});
