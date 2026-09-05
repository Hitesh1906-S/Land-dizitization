import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../src/config/database';
import { OcrService } from '../src/services/ocr/ocr.adapter';
import { UserRole } from '../src/constants/index';

describe('Human Verification Workflow for AI/OCR Results', () => {
  let officerId: string;
  let citizenId: string;
  let documentId: string;
  let requestId: string;
  let ocrResultId: string;
  let highConfFieldId: string;
  let lowConfFieldId: string;
  let missingFieldId: string;

  before(async () => {
    // 1. Create Officer User
    const officer = await prisma.user.create({
      data: {
        email: `officer-hitl-${Date.now()}@revenue.gov.in`,
        passwordHash: 'hashed_secret',
        fullName: 'Shri Vikram Rathore (Tehsildar)',
        roleName: UserRole.REVENUE_OFFICER,
      },
    });
    officerId = officer.id;

    // 2. Create Citizen User
    const citizen = await prisma.user.create({
      data: {
        email: `citizen-hitl-${Date.now()}@citizen.gov.in`,
        passwordHash: 'hashed_secret',
        fullName: 'Rameshwar Dayal',
        roleName: UserRole.CITIZEN,
      },
    });
    citizenId = citizen.id;

    // 3. Create Request
    const request = await prisma.request.create({
      data: {
        applicationNumber: `REQ-HITL-${Date.now()}`,
        applicantId: citizenId,
        requestType: 'NEW_DIGITIZATION',
        stage: 'DOCUMENT_VERIFICATION',
        assignedOfficerId: officerId,
      },
    });
    requestId = request.id;

    // 4. Create Document
    const doc = await prisma.document.create({
      data: {
        fileName: 'jamabandi_deed_scan.pdf',
        fileType: 'application/pdf',
        filePath: 'uploads/jamabandi_deed_scan.pdf',
        fileSize: 10240,
        fileHash: 'sha256_mock_hash_123',
        documentType: 'REGISTRATION_DEED',
        uploadedById: citizenId,
        requestId,
      },
    });
    documentId = doc.id;

    // 5. Create OCRResult
    const ocr = await prisma.oCRResult.create({
      data: {
        documentId,
        status: 'COMPLETED',
        engine: 'HYBRID',
        rawText: 'Village: Rampur Khurd | Khasra: 142/4/1 | Owner: Rameshwar Dayal',
        confidenceScore: 0.82,
      },
    });
    ocrResultId = ocr.id;

    // 6. Create Extracted Fields:
    // Field 1: High confidence owner (0.94)
    const f1 = await prisma.extractedField.create({
      data: {
        ocrResultId,
        fieldName: 'owner',
        fieldValue: 'Rameshwar Dayal',
        confidence: 0.94,
        boundingBoxJson: JSON.stringify({
          sourceSnippet: 'Owner: Rameshwar Dayal',
          isUncertain: false,
          isMissing: false,
          status: 'CONFIRMED',
          verificationState: 'PENDING',
        }),
      },
    });
    highConfFieldId = f1.id;

    // Field 2: Low confidence Khasra number (0.62)
    const f2 = await prisma.extractedField.create({
      data: {
        ocrResultId,
        fieldName: 'khasraNumber',
        fieldValue: '142/4/?',
        confidence: 0.62,
        boundingBoxJson: JSON.stringify({
          sourceSnippet: 'Khasra: 142/4/?',
          isUncertain: true,
          isMissing: false,
          status: 'UNCERTAIN',
          verificationState: 'PENDING',
        }),
      },
    });
    lowConfFieldId = f2.id;

    // Field 3: Missing plot number
    const f3 = await prisma.extractedField.create({
      data: {
        ocrResultId,
        fieldName: 'plotNumber',
        fieldValue: '',
        confidence: 0.0,
        boundingBoxJson: JSON.stringify({
          sourceSnippet: null,
          isUncertain: false,
          isMissing: true,
          status: 'MISSING',
          verificationState: 'PENDING',
        }),
      },
    });
    missingFieldId = f3.id;
  });

  it('1. Officer approves a high-confidence field', async () => {
    const res = await OcrService.approveField(highConfFieldId, officerId);
    assert.equal(res.id, highConfFieldId);
    assert.equal(res.isVerified, true);
    assert.equal(res.verifiedValue, 'Rameshwar Dayal');

    // Verify audit log
    const audit = await prisma.auditLog.findFirst({
      where: { entityId: highConfFieldId, action: 'APPROVE_OCR_FIELD' },
    });
    assert.ok(audit);
    assert.equal(audit.actorId, officerId);
  });

  it('2. Officer corrects a low-confidence field with audit trail', async () => {
    const res = await OcrService.correctField(
      lowConfFieldId,
      '142/4/1',
      officerId,
      'Resolved occluded numeral 1 from physical seal'
    );

    assert.equal(res.id, lowConfFieldId);
    assert.equal(res.isVerified, true);
    assert.equal(res.verifiedValue, '142/4/1');

    const meta = typeof res.boundingBoxJson === 'string' ? JSON.parse(res.boundingBoxJson) : (res.boundingBoxJson || {});
    assert.equal(meta.verificationState, 'CORRECTED');
    assert.equal(meta.isUncertain, false);
    assert.equal(meta.history?.length, 1);
    assert.equal(meta.history[0].previousValue, '142/4/?');
    assert.equal(meta.history[0].correctedValue, '142/4/1');
  });

  it('3. Guardrail: Blocks approving complete record while unreviewed low-confidence / missing fields remain', async () => {
    // missingFieldId is still missing and pending review
    await assert.rejects(
      async () => {
        await OcrService.approveCompleteRecord(documentId, officerId);
      },
      (err: any) => {
        assert.ok(err.message.includes('low-confidence or missing fields require explicit officer review'));
        return true;
      }
    );
  });

  it('4. Officer fills in missing field value and approves complete record successfully', async () => {
    // Officer corrects missing field
    await OcrService.correctField(missingFieldId, '55-B', officerId, 'Found in header stamp');

    // Complete record approval should now succeed
    const approvalRes = await OcrService.approveCompleteRecord(
      documentId,
      officerId,
      'All 3 fields reviewed and approved'
    );

    assert.equal(approvalRes.success, true);
    assert.ok(approvalRes.landRecordId);

    // Verify LandRecord status in database
    const landRecord = await prisma.landRecord.findUnique({
      where: { id: approvalRes.landRecordId },
    });
    assert.ok(landRecord);
    assert.equal(landRecord.status, 'VERIFIED');

    // Verify Request stage
    const req = await prisma.request.findUnique({
      where: { id: requestId },
    });
    assert.equal(req?.stage, 'FINAL_APPROVAL');
  });

  it('5. Officer sends back document for correction with defect notes', async () => {
    const sendBackRes = await OcrService.sendBackForCorrection(
      documentId,
      'Certified map annexure missing. Please upload page 3 with surveyor stamp.',
      officerId
    );

    assert.equal(sendBackRes.success, true);

    const req = await prisma.request.findUnique({
      where: { id: requestId },
    });
    assert.equal(req?.stage, 'NEEDS_CORRECTION');
    assert.ok(req?.rejectionReason?.includes('Certified map annexure missing'));
  });
});
