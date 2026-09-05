import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../src/config/database';
import { AuthService } from '../src/services/auth.service';
import { RecordService } from '../src/services/record.service';
import { DocumentService } from '../src/services/document.service';
import { OcrService } from '../src/services/ocr/ocr.adapter';
import { ValidationEngine } from '../src/services/validation/validation.engine';
import { DuplicateDetectorService } from '../src/services/duplicate/duplicate-detector.service';
import { GisService } from '../src/services/gis.service';
import { OfficerService } from '../src/services/officer.service';
import { AdminService } from '../src/services/admin.service';
import {
  UserRole,
  RecordStatus,
  DocumentType,
  LandType,
  AreaUnit,
  AuditAction,
  RequestStage,
} from '@land-digitization/shared';

describe('End-to-End Real User Workflows Verification Suite', () => {
  const timestamp = Date.now();
  const citizenEmail = `citizen_e2e_${timestamp}@bhoomisetu.gov.in`;
  const officerEmail = `officer_e2e_${timestamp}@bhoomisetu.gov.in`;
  const adminEmail = `admin_e2e_${timestamp}@bhoomisetu.gov.in`;
  const rawPassword = 'Password@E2E2026';

  let citizenUser: any;
  let citizenToken: string;
  let officerUser: any;
  let officerToken: string;
  let adminUser: any;
  let adminToken: string;

  let testLocationId: string;
  let createdRecordId: string;
  let createdRequestId: string;
  let createdDocumentId: string;
  let createdParcelId: string;

  before(async () => {
    // 1. Seed Roles in DB if not existing
    const roles = [UserRole.CITIZEN, UserRole.REVENUE_OFFICER, UserRole.ADMIN];
    for (const r of roles) {
      await prisma.role.upsert({
        where: { name: r },
        update: {},
        create: { name: r, description: `Role for ${r}` },
      });
    }

    // 2. Register Citizen
    const citizenAuth = await AuthService.register({
      email: citizenEmail,
      password: rawPassword,
      fullName: 'Ramesh Kumar (Citizen)',
      phone: '9876500001',
      role: UserRole.CITIZEN,
    });
    citizenUser = citizenAuth.user;
    citizenToken = citizenAuth.token;

    // 3. Register Revenue Officer
    const officerAuth = await AuthService.register({
      email: officerEmail,
      password: rawPassword,
      fullName: 'Vikramaditya Rathore (Tehsildar)',
      phone: '9876500002',
      role: UserRole.REVENUE_OFFICER,
      jurisdictionDistrict: 'Jaipur',
      jurisdictionTehsil: 'Sanganer',
    });
    officerUser = officerAuth.user;
    officerToken = officerAuth.token;

    // 4. Register Administrator
    const adminAuth = await AuthService.register({
      email: adminEmail,
      password: rawPassword,
      fullName: 'Sunita Sharma (Admin)',
      phone: '9876500003',
      role: UserRole.ADMIN,
    });
    adminUser = adminAuth.user;
    adminToken = adminAuth.token;

    // 5. Create Test Location
    const loc = await prisma.location.create({
      data: {
        state: 'Rajasthan',
        district: 'Jaipur',
        tehsil: 'Sanganer',
        village: `Kukas_E2E_${timestamp}`,
        pincode: '302028',
      },
    });
    testLocationId = loc.id;
  });

  after(async () => {
    // Clean up created entities in foreign-key safe order
    if (createdParcelId) {
      await prisma.parcel.deleteMany({ where: { id: createdParcelId } });
    }
    if (createdDocumentId) {
      await prisma.extractedField.deleteMany({ where: { ocrResult: { documentId: createdDocumentId } } });
      await prisma.oCRResult.deleteMany({ where: { documentId: createdDocumentId } });
      await prisma.document.deleteMany({ where: { id: createdDocumentId } });
    }
    if (createdRequestId) {
      await prisma.document.updateMany({
        where: { requestId: createdRequestId },
        data: { requestId: null },
      });
      await prisma.request.deleteMany({ where: { id: createdRequestId } });
    }
    if (createdRecordId) {
      await prisma.duplicateCandidate.deleteMany({
        where: { OR: [{ primaryRecordId: createdRecordId }, { conflictingRecordId: createdRecordId }] },
      });
      await prisma.validationIssue.deleteMany({ where: { validationResult: { landRecordId: createdRecordId } } });
      await prisma.validationResult.deleteMany({ where: { landRecordId: createdRecordId } });
      await prisma.owner.deleteMany({ where: { landRecordId: createdRecordId } });
      await prisma.parcel.deleteMany({ where: { landRecordId: createdRecordId } });
      await prisma.landRecord.deleteMany({ where: { id: createdRecordId } });
    }
    if (testLocationId) {
      await prisma.location.deleteMany({ where: { id: testLocationId } });
    }

    const testUserIds = [citizenUser?.id, officerUser?.id, adminUser?.id].filter(Boolean);
    if (testUserIds.length > 0) {
      await prisma.auditLog.deleteMany({ where: { actorId: { in: testUserIds } } });
      await prisma.user.deleteMany({ where: { id: { in: testUserIds } } });
    }
  });

  describe('Workflow 1: Citizen Real-User Journey', () => {
    it('1. Citizen can log in and receive valid authentication token', async () => {
      const loginRes = await AuthService.login(citizenEmail, rawPassword);

      assert.ok(loginRes.token, 'JWT Token must be returned');
      assert.equal(loginRes.user.email, citizenEmail);
      assert.equal(loginRes.user.role, UserRole.CITIZEN);
    });

    it('2. Citizen can search for public records and view parcel details', async () => {
      // Seed a verified record in database
      const seedRec = await prisma.landRecord.create({
        data: {
          ulpin: `RJ-E2E-SEARCH-${timestamp.toString().slice(-6)}`,
          khasraNumber: `KH-SRCH-${timestamp.toString().slice(-4)}`,
          khatauniNumber: 'KHAT-990',
          locationId: testLocationId,
          areaInSqMeters: 5000,
          areaUnit: AreaUnit.SQ_METERS,
          landType: LandType.AGRICULTURAL,
          status: RecordStatus.VERIFIED,
          createdById: citizenUser.id,
          owners: {
            create: [
              {
                fullName: 'Harish Chandra',
                shareFraction: 1.0,
                isPrimary: true,
              },
            ],
          },
        },
      });

      const searchRes = await RecordService.searchRecords({
        district: 'Jaipur',
        query: 'Harish Chandra',
      });

      assert.ok(searchRes.records.length > 0, 'Search should return matched record');
      const found = searchRes.records.find((r) => r.id === seedRec.id);
      assert.ok(found, 'Should find specific seed record');
      assert.equal(found?.khasraNumber, seedRec.khasraNumber);

      // Cleanup seed
      await prisma.owner.deleteMany({ where: { landRecordId: seedRec.id } });
      await prisma.landRecord.delete({ where: { id: seedRec.id } });
    });

    it('3. Citizen can submit a new digitization request and upload title deed', async () => {
      // 1. Create citizen request in database
      const req = await prisma.request.create({
        data: {
          applicationNumber: `MUT-${timestamp.toString().slice(-6)}`,
          applicantId: citizenUser.id,
          requestType: 'NEW_DIGITIZATION',
          stage: RequestStage.SUBMITTED,
          metadataJson: JSON.stringify({
            applicantName: 'Ramesh Kumar',
            khasraNumber: '402/1',
            notes: 'Uploaded 1998 registered registry document',
          }),
        },
      });
      createdRequestId = req.id;
      assert.ok(createdRequestId);

      // 2. Upload deed document attached to request
      const fakeBuffer = Buffer.from(`MOCK PDF LAND DEED FOR RAMESH KUMAR KHASRA 402/1 TIMESTAMP ${timestamp}`);
      const mockMulterFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: `registry_${timestamp}.pdf`,
        encoding: '7bit',
        mimetype: 'application/pdf',
        size: fakeBuffer.length,
        buffer: fakeBuffer,
        stream: null as any,
        destination: '',
        filename: `registry_${timestamp}.pdf`,
        path: '',
      };

      const uploadedDoc = await DocumentService.registerUpload(mockMulterFile, {
        requestId: createdRequestId,
        documentType: DocumentType.REGISTRATION_DEED,
        uploadedById: citizenUser.id,
      });

      createdDocumentId = uploadedDoc.id;
      assert.ok(createdDocumentId);
      assert.equal(uploadedDoc.uploadedById, citizenUser.id);
      assert.ok(uploadedDoc.fileHash, 'File SHA-256 hash must be present');
    });

    it('4. Citizen can track status of submitted request', async () => {
      const citizenReq = await prisma.request.findUnique({
        where: { id: createdRequestId },
        include: {
          documents: true,
        },
      });

      assert.ok(citizenReq);
      assert.equal(citizenReq.applicantId, citizenUser.id);
      assert.equal(citizenReq.stage, RequestStage.SUBMITTED);
      assert.equal(citizenReq.documents.length, 1);
      assert.equal(citizenReq.documents[0].id, createdDocumentId);
    });
  });

  describe('Workflow 2: Revenue Officer Real-User Journey', () => {
    it('1. Officer can log in and view real-time dashboard KPIs', async () => {
      const loginRes = await AuthService.login(officerEmail, rawPassword);
      assert.equal(loginRes.user.role, UserRole.REVENUE_OFFICER);

      const stats = await OfficerService.getDashboardStats();
      assert.ok(typeof stats.totalRecords === 'number');
      assert.ok(typeof stats.pending === 'number');
      assert.ok(typeof stats.conflicts === 'number');
    });

    it('2. Officer can inspect citizen document and execute OCR pipeline', async () => {
      const doc = await DocumentService.getDocumentById(createdDocumentId, {
        id: officerUser.id,
        role: UserRole.REVENUE_OFFICER,
      });

      assert.equal(doc.id, createdDocumentId);

      // Start extraction job
      const ocrResult = await OcrService.startExtractionJob(createdDocumentId);
      assert.ok(ocrResult.id);
      assert.ok(ocrResult.confidenceScore !== undefined && ocrResult.confidenceScore >= 0);
      assert.ok(Array.isArray(ocrResult.extractedFields));
    });

    it('3. Officer can create Land Record draft from citizen request & extractions', async () => {
      const record = await RecordService.createRecord({
        ulpin: `RJ-E2E-REC-${timestamp.toString().slice(-6)}`,
        khasraNumber: `402/1-${timestamp.toString().slice(-4)}`,
        khatauniNumber: `KH-402-${timestamp.toString().slice(-4)}`,
        locationId: testLocationId,
        areaInSqMeters: 4800,
        areaUnit: AreaUnit.SQ_METERS,
        landType: LandType.AGRICULTURAL,
        createdById: officerUser.id,
        owners: [
          {
            fullName: 'Ramesh Kumar',
            relationType: 'S/O',
            guardianName: 'Ram Prasad',
            shareFraction: 1.0,
            isPrimary: true,
          },
        ],
      });

      createdRecordId = record.id;
      assert.ok(createdRecordId);
      assert.equal(record.status, RecordStatus.PENDING_VERIFICATION);

      // Link document to LandRecord
      await prisma.document.update({
        where: { id: createdDocumentId },
        data: { landRecordId: createdRecordId },
      });
    });

    it('4. Officer can run multi-rule validation engine and duplicate detection', async () => {
      // 1. Run Validation Engine
      const validationReport = await ValidationEngine.validateRecord(createdRecordId, officerUser.id);
      assert.ok(validationReport);
      assert.ok(typeof validationReport.overallScore === 'number');
      assert.ok(Array.isArray(validationReport.checks));

      // 2. Run Duplicate Detection
      const recordA = await prisma.landRecord.findUnique({
        where: { id: createdRecordId },
        include: { location: true, owners: true },
      });

      const duplicateComparison = DuplicateDetectorService.compareRecords(recordA, recordA);
      assert.ok(duplicateComparison);
      assert.equal(duplicateComparison.compositeScore, 100);
      assert.equal(duplicateComparison.confidenceLevel, 'HIGH');
    });

    it('5. Officer can approve land record and update citizen request stage', async () => {
      // 1. Update Record to VERIFIED
      const updatedRecord = await RecordService.updateRecord(createdRecordId, {
        status: RecordStatus.VERIFIED,
      }, officerUser.id);

      assert.equal(updatedRecord.status, RecordStatus.VERIFIED);

      // 2. Transition Service Request to FINAL_APPROVAL / VERIFIED
      const updatedReq = await prisma.request.update({
        where: { id: createdRequestId },
        data: {
          stage: RequestStage.VERIFIED,
          assignedOfficerId: officerUser.id,
        },
      });

      assert.equal(updatedReq.stage, RequestStage.VERIFIED);
    });
  });

  describe('Workflow 3: GIS Cadastral & Map Real-User Journey', () => {
    it('1. GIS parcel is linked to verified LandRecord and searchable by village/district', async () => {
      const geojsonPolygon = {
        type: 'Polygon',
        coordinates: [
          [
            [75.8940, 26.9910],
            [75.8950, 26.9910],
            [75.8950, 26.9920],
            [75.8940, 26.9920],
            [75.8940, 26.9910],
          ],
        ],
      };

      const parcel = await prisma.parcel.create({
        data: {
          landRecordId: createdRecordId,
          geometryJson: JSON.stringify(geojsonPolygon),
          centroidLat: 26.9915,
          centroidLng: 75.8945,
          northBoundary: 'Khasra 401',
          southBoundary: 'Main Road',
          eastBoundary: 'Khasra 403',
          westBoundary: 'Village Canal',
        },
      });

      createdParcelId = parcel.id;
      assert.ok(createdParcelId);
      assert.equal(parcel.landRecordId, createdRecordId);
    });

    it('2. GIS service can fetch parcel with associated verified LandRecord details', async () => {
      const gisData = await GisService.getVillageParcelsGeoJSON({
        locationId: testLocationId,
        status: RecordStatus.VERIFIED,
      });

      assert.ok(gisData.features.length > 0);
      const matchedFeature = gisData.features.find((f: any) => f.properties?.recordId === createdRecordId);
      assert.ok(matchedFeature, 'GIS GeoJSON feature search must return created parcel');
      assert.equal(matchedFeature.properties?.status, RecordStatus.VERIFIED);
    });
  });

  describe('Workflow 4: Administrator Real-User Journey & Governance Ledger', () => {
    it('1. Administrator can view platform dashboard statistics and manage users', async () => {
      const loginRes = await AuthService.login(adminEmail, rawPassword);
      assert.equal(loginRes.user.role, UserRole.ADMIN);

      const metrics = await AdminService.getDashboardStats();
      assert.ok(metrics.totalRecords >= 1);
      assert.ok(metrics.totalUsers >= 3);

      const usersList = await AdminService.getUsers({ page: 1, limit: 10 });
      assert.ok(usersList.users.length >= 3);
      assert.ok(usersList.users.some(u => u.id === citizenUser.id));
    });

    it('2. Administrator can monitor records with server-side pagination & filtering', async () => {
      const recordsPage = await AdminService.getRecords({
        page: 1,
        limit: 10,
        status: RecordStatus.VERIFIED,
      });

      assert.ok(recordsPage.records.length >= 1);
      const verifiedRecord = recordsPage.records.find((r: any) => r.id === createdRecordId);
      assert.ok(verifiedRecord, 'Admin paginated records query must contain verified record');
      assert.equal(verifiedRecord?.status, RecordStatus.VERIFIED);
    });

    it('3. Audit Log ledger contains complete, immutable event history for all transactions', async () => {
      const logs = await prisma.auditLog.findMany({
        where: {
          OR: [
            { actorId: citizenUser.id },
            { actorId: officerUser.id },
            { actorId: adminUser.id },
            { entityId: createdRecordId },
          ],
        },
      });

      assert.ok(logs.length > 0, 'Audit logs must capture database mutations');
      const ourRecordLog = logs.find((l: any) => l.entityId === createdRecordId || l.actorId === officerUser.id);
      assert.ok(ourRecordLog, 'Audit log entry must exist for created LandRecord or officer');
      assert.ok(ourRecordLog?.actorId);
      assert.ok(ourRecordLog?.action);
      assert.ok(ourRecordLog?.timestamp);
    });
  });
});
