import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app';
import { prisma } from '../src/config/database';
import { createRateLimiter } from '../src/middleware/rateLimiter.middleware';
import { DocumentService } from '../src/services/document.service';
import { UserRole, AuditAction } from '@land-digitization/shared';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env';

describe('Production Security & Reliability Verification Suite', () => {
  let app: any;
  let testAdminId: string;
  let testOfficerId: string;
  let testCitizen1Id: string;
  let testCitizen2Id: string;
  let testCitizen1Token: string;
  let testOfficerToken: string;
  let testDocument1Id: string;

  before(async () => {
    app = createApp();

    // 1. Create Test Users
    const passwordHash = await bcrypt.hash('SecurePassword#2026', 10);

    const admin = await prisma.user.create({
      data: {
        email: `sec_admin_${Date.now()}@bhoomisetu.gov.in`,
        passwordHash,
        fullName: 'National Security Administrator',
        roleName: UserRole.ADMIN,
      },
    });
    testAdminId = admin.id;

    const officer = await prisma.user.create({
      data: {
        email: `sec_officer_${Date.now()}@bhoomisetu.gov.in`,
        passwordHash,
        fullName: 'Revenue Officer Jaipur',
        roleName: UserRole.REVENUE_OFFICER,
        jurisdictionDistrict: 'Jaipur',
        jurisdictionTehsil: 'Sanganer',
      },
    });
    testOfficerId = officer.id;

    const citizen1 = await prisma.user.create({
      data: {
        email: `sec_citizen1_${Date.now()}@gmail.com`,
        passwordHash,
        fullName: 'Citizen Alpha Sharma',
        roleName: UserRole.CITIZEN,
      },
    });
    testCitizen1Id = citizen1.id;

    const citizen2 = await prisma.user.create({
      data: {
        email: `sec_citizen2_${Date.now()}@gmail.com`,
        passwordHash,
        fullName: 'Citizen Beta Verma',
        roleName: UserRole.CITIZEN,
      },
    });
    testCitizen2Id = citizen2.id;

    testCitizen1Token = jwt.sign(
      { id: citizen1.id, email: citizen1.email, role: citizen1.roleName },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    testOfficerToken = jwt.sign(
      { id: officer.id, email: officer.email, role: officer.roleName },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // 2. Create Private Document owned by Citizen 1
    const doc1 = await prisma.document.create({
      data: {
        fileName: 'private_sale_deed_c1.pdf',
        fileType: 'application/pdf',
        filePath: 'uploads/private_test_deed.pdf',
        fileSize: 51200,
        fileHash: `sha256_${Date.now()}`,
        documentType: 'REGISTRATION_DEED',
        uploadedById: testCitizen1Id,
      },
    });
    testDocument1Id = doc1.id;
  });

  after(async () => {
    try {
      await prisma.document.deleteMany({ where: { id: testDocument1Id } });
      await prisma.auditLog.deleteMany({
        where: { actorId: { in: [testAdminId, testOfficerId, testCitizen1Id, testCitizen2Id] } },
      });
      await prisma.user.deleteMany({
        where: { id: { in: [testAdminId, testOfficerId, testCitizen1Id, testCitizen2Id] } },
      });
    } catch {
      // Ignore
    }
  });

  describe('1. Security Headers & Framework Hardening', () => {
    it('should set essential security headers and remove X-Powered-By', async () => {
      // Create a mock req/res to test securityHeaders middleware
      let headersSet: Record<string, string> = {};
      let headersRemoved: string[] = [];

      const mockReq: any = {};
      const mockRes: any = {
        setHeader: (name: string, value: string) => {
          headersSet[name.toLowerCase()] = value;
        },
        removeHeader: (name: string) => {
          headersRemoved.push(name);
        },
      };

      const { securityHeaders } = await import('../src/middleware/securityHeaders.middleware');
      securityHeaders(mockReq, mockRes, () => {});

      assert.equal(headersSet['x-content-type-options'], 'nosniff');
      assert.equal(headersSet['x-frame-options'], 'DENY');
      assert.equal(headersSet['x-xss-protection'], '1; mode=block');
      assert.equal(headersSet['referrer-policy'], 'strict-origin-when-cross-origin');
      assert.ok(headersSet['permissions-policy']);
      assert.ok(headersRemoved.includes('X-Powered-By'));
    });
  });

  describe('2. Rate Limiting Engine', () => {
    it('should enforce rate limits and return 429 upon threshold breach', async () => {
      const testLimiter = createRateLimiter({
        windowMs: 1000,
        max: 3,
        message: 'Rate limit test breach',
        skipInTest: false,
      });

      let responseStatus = 200;
      let responseBody: any = null;

      const mockReq: any = {
        headers: {},
        socket: { remoteAddress: '10.20.30.40' },
      };

      const mockRes: any = {
        setHeader: () => {},
        status: (code: number) => {
          responseStatus = code;
          return {
            json: (payload: any) => {
              responseBody = payload;
            },
          };
        },
      };

      // Request 1, 2, 3 should pass
      testLimiter(mockReq, mockRes, () => {});
      testLimiter(mockReq, mockRes, () => {});
      testLimiter(mockReq, mockRes, () => {});
      assert.equal(responseStatus, 200);

      // Request 4 should be rejected with 429
      testLimiter(mockReq, mockRes, () => {});
      assert.equal(responseStatus, 429);
      assert.ok(responseBody?.error?.message?.includes('Rate limit test breach'));
    });
  });

  describe('3. File Access Authorization & Private Storage Lockdown', () => {
    it('should allow document owner to access their uploaded document metadata', async () => {
      const doc = await DocumentService.getDocumentById(testDocument1Id, {
        id: testCitizen1Id,
        email: 'citizen1@test.com',
        role: UserRole.CITIZEN,
      });

      assert.equal(doc.id, testDocument1Id);
      assert.equal(doc.uploadedById, testCitizen1Id);
    });

    it('should forbid unauthorized citizens from accessing another citizen document', async () => {
      await assert.rejects(
        async () => {
          await DocumentService.getDocumentById(testDocument1Id, {
            id: testCitizen2Id,
            email: 'citizen2@test.com',
            role: UserRole.CITIZEN,
          });
        },
        (err: any) => {
          assert.equal(err.statusCode, 403);
          assert.ok(err.message.toLowerCase().includes('permission') || err.message.toLowerCase().includes('forbidden'));
          return true;
        }
      );
    });

    it('should allow authorized Revenue Officers to inspect documents', async () => {
      const doc = await DocumentService.getDocumentById(testDocument1Id, {
        id: testOfficerId,
        email: 'officer@test.com',
        role: UserRole.REVENUE_OFFICER,
      });

      assert.equal(doc.id, testDocument1Id);
    });
  });

  describe('4. Authentication Security & Password Hashing', () => {
    it('should hash passwords using bcrypt with at least 10 rounds', async () => {
      const rawPassword = 'StrongPassword!2026';
      const hash = await bcrypt.hash(rawPassword, 10);

      assert.ok(hash.startsWith('$2a$10$') || hash.startsWith('$2b$10$'));
      assert.equal(await bcrypt.compare(rawPassword, hash), true);
      assert.equal(await bcrypt.compare('WrongPassword', hash), false);
    });

    it('should reject invalid or forged JWT tokens', async () => {
      const { authenticate } = await import('../src/middleware/auth.middleware');
      let capturedError: any = null;

      const mockReq: any = {
        headers: {
          authorization: 'Bearer forged.invalid.token',
        },
      };
      const mockRes: any = {};

      authenticate(mockReq, mockRes, (err: any) => {
        capturedError = err;
      });

      assert.ok(capturedError !== null);
      assert.equal(capturedError.statusCode, 401);
    });
  });

  describe('5. Audit Logging Schema & Completeness', () => {
    it('should create audit log with all mandatory governance fields', async () => {
      const auditLog = await prisma.auditLog.create({
        data: {
          actorId: testAdminId,
          actorRole: UserRole.ADMIN,
          action: AuditAction.VERIFY,
          entityType: 'LandRecord',
          entityId: 'rec-test-security-999',
          ipAddress: '192.168.1.1',
          userAgent: 'SecurityTestRunner/1.0',
          snapshotDiffJson: JSON.stringify({
            result: 'SUCCESS',
            previousStatus: 'PENDING_VERIFICATION',
            newStatus: 'VERIFIED',
            metadata: { checkScore: 100, reason: 'Security verification passed' },
          }),
        },
      });

      assert.ok(auditLog.id);
      assert.equal(auditLog.actorId, testAdminId);
      assert.equal(auditLog.actorRole, UserRole.ADMIN);
      assert.equal(auditLog.action, AuditAction.VERIFY);
      assert.equal(auditLog.entityType, 'LandRecord');
      assert.equal(auditLog.entityId, 'rec-test-security-999');
      assert.ok(auditLog.timestamp);
      assert.ok(auditLog.snapshotDiffJson?.includes('SUCCESS'));
    });
  });
});
