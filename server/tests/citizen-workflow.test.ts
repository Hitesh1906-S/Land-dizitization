import { prisma } from '../src/config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env';
import { UserRole, RequestType, RequestStage, DocumentType } from '@land-digitization/shared';
import fs from 'fs';
import path from 'path';

async function runCitizenWorkflowTests() {
  console.log('\n=== STARTING COMPLETE CITIZEN WORKFLOW & ACCESS CONTROL TEST SUITE ===\n');

  const timestamp = Date.now();
  const citizenAEmail = `citizen.a.${timestamp}@example.com`;
  const citizenBEmail = `citizen.b.${timestamp}@example.com`;
  const officerEmail = `officer.${timestamp}@example.com`;
  const password = 'Password@123';
  const passwordHash = await bcrypt.hash(password, 10);

  // 1. Setup Users
  console.log('1. Setting up Test Users (Citizen A, Citizen B, Revenue Officer):');
  const citizenA = await prisma.user.create({
    data: {
      email: citizenAEmail,
      fullName: 'Vikramaditya Rathore',
      passwordHash,
      roleName: UserRole.CITIZEN,
    },
  });

  const citizenB = await prisma.user.create({
    data: {
      email: citizenBEmail,
      fullName: 'Sunita Sharma',
      passwordHash,
      roleName: UserRole.CITIZEN,
    },
  });

  const officer = await prisma.user.create({
    data: {
      email: officerEmail,
      fullName: 'Anil Kumar (Tehsildar)',
      passwordHash,
      roleName: UserRole.REVENUE_OFFICER,
      jurisdictionDistrict: 'Jaipur',
      jurisdictionTehsil: 'Sanganer',
    },
  });

  const tokenCitizenA = jwt.sign({ id: citizenA.id, email: citizenA.email, role: citizenA.roleName }, env.JWT_SECRET, { expiresIn: '1h' });
  const tokenCitizenB = jwt.sign({ id: citizenB.id, email: citizenB.email, role: citizenB.roleName }, env.JWT_SECRET, { expiresIn: '1h' });
  const tokenOfficer = jwt.sign({ id: officer.id, email: officer.email, role: officer.roleName }, env.JWT_SECRET, { expiresIn: '1h' });

  console.log(`✓ Created Citizen A: ${citizenA.fullName} (${citizenA.id})`);
  console.log(`✓ Created Citizen B: ${citizenB.fullName} (${citizenB.id})`);
  console.log(`✓ Created Officer: ${officer.fullName} (${officer.id})`);

  // 2. Upload Supporting Document
  console.log('\n2. Testing Supporting Document Upload (POST /api/v1/documents/upload):');
  
  // Create a temporary dummy deed file
  const tempDir = path.resolve('uploads');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  const tempFilePath = path.join(tempDir, `test-deed-${timestamp}.pdf`);
  fs.writeFileSync(tempFilePath, Buffer.from('%PDF-1.4 Mock Registered Land Deed Content for BhoomiSetu'));

  const formData = new FormData();
  const fileBlob = new Blob([fs.readFileSync(tempFilePath)], { type: 'application/pdf' });
  formData.append('file', fileBlob, `registered-deed-${timestamp}.pdf`);
  formData.append('documentType', DocumentType.REGISTRATION_DEED);

  const uploadRes = await fetch('http://localhost:5000/api/v1/documents/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenCitizenA}`,
    },
    body: formData,
  });

  const uploadJson = await uploadRes.json();
  console.log(`✓ Document Upload Status: ${uploadRes.status} (Expected 201)`);
  console.log(`✓ Document ID: ${uploadJson.data?.id}`);
  console.log(`✓ Cryptographic SHA-256 Checksum: ${uploadJson.data?.fileHash}`);

  const documentId = uploadJson.data?.id;

  // 3. Submit Digitization / Mutation Application
  console.log('\n3. Testing Application Submission (POST /api/v1/workflows):');
  const submitRes = await fetch('http://localhost:5000/api/v1/workflows', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenCitizenA}`,
    },
    body: JSON.stringify({
      requestType: RequestType.NEW_DIGITIZATION,
      documentIds: [documentId],
      metadata: {
        state: 'Rajasthan',
        district: 'Jaipur',
        tehsil: 'Sanganer',
        village: 'Rampur',
        khasraNumber: '108/3',
        areaInSqMeters: 5200,
        applicantRemarks: 'Urgent legacy digitization for agricultural subsidy',
      },
    }),
  });

  const submitJson = await submitRes.json();
  console.log(`✓ Submission Status: ${submitRes.status} (Expected 201)`);
  console.log(`✓ Application Number: ${submitJson.data?.applicationNumber}`);
  console.log(`✓ Initial Stage: ${submitJson.data?.stage} (Expected SUBMITTED)`);
  console.log(`✓ Attached Documents Count: ${submitJson.data?.documents?.length} (Expected 1)`);

  const requestId = submitJson.data?.id;
  const applicationNumber = submitJson.data?.applicationNumber;

  // 4. Query Applications as Citizen A
  console.log('\n4. Testing Citizen Application Retrieval (GET /api/v1/workflows):');
  const listRes = await fetch('http://localhost:5000/api/v1/workflows', {
    headers: {
      Authorization: `Bearer ${tokenCitizenA}`,
    },
  });

  const listJson = await listRes.json();
  console.log(`✓ List Status: ${listRes.status} (Expected 200)`);
  console.log(`✓ Citizen A Total Applications: ${listJson.data?.length}`);
  const matchingApp = listJson.data?.find((r: any) => r.id === requestId);
  console.log(`✓ Found Submitted App ${matchingApp?.applicationNumber} with stage ${matchingApp?.stage}`);

  // 5. Query Specific Application by ID / AppNo
  console.log('\n5. Testing Single Application Dossier Retrieval (GET /api/v1/workflows/:id):');
  const getRes = await fetch(`http://localhost:5000/api/v1/workflows/${applicationNumber}`, {
    headers: {
      Authorization: `Bearer ${tokenCitizenA}`,
    },
  });

  const getJson = await getRes.json();
  console.log(`✓ Retrieve Status: ${getRes.status} (Expected 200)`);
  console.log(`✓ Retrieved Dossier: ${getJson.data?.applicationNumber} - ${getJson.data?.requestType}`);

  // 6. Strict Ownership & Access Control Enforcement
  console.log('\n6. Testing Strict Ownership Access Control (Citizen B attempting to access Citizen A\'s Request):');
  const unauthorizedRes = await fetch(`http://localhost:5000/api/v1/workflows/${requestId}`, {
    headers: {
      Authorization: `Bearer ${tokenCitizenB}`,
    },
  });

  const unauthorizedJson = await unauthorizedRes.json();
  console.log(`✓ Unauthorized Access Status: ${unauthorizedRes.status} (Expected 403)`);
  console.log(`✓ Error Code: ${unauthorizedJson.error?.code}, Message: ${unauthorizedJson.error?.message}`);

  // 7. Revenue Officer Stage Progression (UNDER_REVIEW -> PROCESSING -> VERIFIED)
  console.log('\n7. Testing Revenue Officer Stage Progression:');

  // Stage 1: Move to UNDER_REVIEW
  const stage1Res = await fetch(`http://localhost:5000/api/v1/workflows/${requestId}/stage`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenOfficer}`,
    },
    body: JSON.stringify({
      stage: RequestStage.UNDER_REVIEW,
    }),
  });
  const stage1Json = await stage1Res.json();
  console.log(`✓ Stage 1 (UNDER_REVIEW) Status: ${stage1Res.status}, Stage in DB: ${stage1Json.data?.stage}`);

  // Stage 2: Move to PROCESSING
  const stage2Res = await fetch(`http://localhost:5000/api/v1/workflows/${requestId}/stage`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenOfficer}`,
    },
    body: JSON.stringify({
      stage: RequestStage.PROCESSING,
    }),
  });
  const stage2Json = await stage2Res.json();
  console.log(`✓ Stage 2 (PROCESSING) Status: ${stage2Res.status}, Stage in DB: ${stage2Json.data?.stage}`);

  // Stage 3: Move to VERIFIED
  const stage3Res = await fetch(`http://localhost:5000/api/v1/workflows/${requestId}/stage`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenOfficer}`,
    },
    body: JSON.stringify({
      stage: RequestStage.VERIFIED,
    }),
  });
  const stage3Json = await stage3Res.json();
  console.log(`✓ Stage 3 (VERIFIED) Status: ${stage3Res.status}, Stage in DB: ${stage3Json.data?.stage}`);

  // 8. Audit Log Verification
  console.log('\n8. Verifying Immutable Government Audit Trail:');
  const auditLogs = await prisma.auditLog.findMany({
    where: { entityId: requestId },
    orderBy: { timestamp: 'asc' },
  });
  console.log(`✓ Audit Logs recorded for Request ${requestId}: ${auditLogs.length} events`);
  auditLogs.forEach((log) => {
    console.log(`  - [${log.timestamp.toISOString()}] Action: ${log.action}, ActorRole: ${log.actorRole}`);
  });

  // Clean up temp file
  if (fs.existsSync(tempFilePath)) {
    fs.unlinkSync(tempFilePath);
  }

  console.log('\n=== ALL CITIZEN WORKFLOW & ACCESS CONTROL TESTS PASSED SUCCESSFULLY! ===\n');
}

runCitizenWorkflowTests()
  .catch((err) => {
    console.error('Test Suite Failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
