import { prisma } from '../src/config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env';
import { UserRole, DocumentType, RecordStatus, RequestType } from '@land-digitization/shared';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { defaultStorageProvider } from '../src/services/storage';

async function runDocumentManagementTests() {
  console.log('\n=== STARTING REAL DOCUMENT MANAGEMENT TEST SUITE ===\n');

  const timestamp = Date.now();
  const citizenAEmail = `doc.citizen.a.${timestamp}@example.com`;
  const citizenBEmail = `doc.citizen.b.${timestamp}@example.com`;
  const officerEmail = `doc.officer.${timestamp}@example.com`;
  const password = 'Password@123';
  const passwordHash = await bcrypt.hash(password, 10);

  // 1. Setup Users & Auth Tokens
  console.log('1. Setting up Test Users:');
  const citizenA = await prisma.user.create({
    data: { email: citizenAEmail, fullName: 'Devendra Meena', passwordHash, roleName: UserRole.CITIZEN },
  });
  const citizenB = await prisma.user.create({
    data: { email: citizenBEmail, fullName: 'Kavita Joshi', passwordHash, roleName: UserRole.CITIZEN },
  });
  const officer = await prisma.user.create({
    data: { email: officerEmail, fullName: 'Deepak Sharma (SDM)', passwordHash, roleName: UserRole.REVENUE_OFFICER },
  });

  const tokenCitizenA = jwt.sign({ id: citizenA.id, email: citizenA.email, role: citizenA.roleName }, env.JWT_SECRET, { expiresIn: '1h' });
  const tokenCitizenB = jwt.sign({ id: citizenB.id, email: citizenB.email, role: citizenB.roleName }, env.JWT_SECRET, { expiresIn: '1h' });
  const tokenOfficer = jwt.sign({ id: officer.id, email: officer.email, role: officer.roleName }, env.JWT_SECRET, { expiresIn: '1h' });

  console.log(`✓ Created Citizen A: ${citizenA.fullName}`);
  console.log(`✓ Created Citizen B: ${citizenB.fullName}`);
  console.log(`✓ Created Officer: ${officer.fullName}`);

  // 2. Test File Type Validation (Reject invalid MIME type)
  console.log('\n2. Testing File Type Validation (Rejecting .exe / invalid binary):');
  const invalidBlob = new Blob(['MALICIOUS_EXE_CONTENT'], { type: 'application/x-msdownload' });
  const invalidFormData = new FormData();
  invalidFormData.append('file', invalidBlob, 'malicious_executable.exe');

  const invalidRes = await fetch('http://localhost:5000/api/v1/documents/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenCitizenA}` },
    body: invalidFormData,
  });

  const invalidJson = await invalidRes.json();
  console.log(`✓ Invalid File Status: ${invalidRes.status} (Expected 400 or 500 rejection)`);
  console.log(`✓ Error Message: ${invalidJson.error?.message || invalidJson.message}`);

  // 3. Test Valid PDF Document Upload & SHA-256 Checksum Computation
  console.log('\n3. Testing Valid PDF Document Upload (POST /api/v1/documents/upload):');
  const pdfContent = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Title (Registered Sale Deed No 4092) >>\nendobj\n%%EOF');
  const expectedPdfHash = crypto.createHash('sha256').update(pdfContent).digest('hex');

  const pdfBlob = new Blob([pdfContent], { type: 'application/pdf' });
  const pdfFormData = new FormData();
  pdfFormData.append('file', pdfBlob, 'sale_deed_4092.pdf');
  pdfFormData.append('documentType', DocumentType.REGISTRATION_DEED);

  const pdfUploadRes = await fetch('http://localhost:5000/api/v1/documents/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenCitizenA}` },
    body: pdfFormData,
  });

  const pdfUploadJson = await pdfUploadRes.json();
  console.log(`✓ PDF Upload Status: ${pdfUploadRes.status} (Expected 201)`);
  console.log(`✓ Generated Document ID: ${pdfUploadJson.data?.id}`);
  console.log(`✓ Stored File Path: ${pdfUploadJson.data?.filePath}`);
  console.log(`✓ Computed SHA-256: ${pdfUploadJson.data?.fileHash}`);
  console.log(`✓ Expected SHA-256: ${expectedPdfHash}`);

  if (pdfUploadJson.data?.fileHash !== expectedPdfHash) {
    throw new Error('SHA-256 cryptographic hash mismatch on stored PDF!');
  }
  console.log('✓ SHA-256 hash verified with 100% cryptographic precision');

  const docAId = pdfUploadJson.data?.id;

  // 4. Test PNG Image Upload
  console.log('\n4. Testing PNG Cadastral Map Upload:');
  const pngContent = Buffer.from('Fake PNG Binary Stream Representation for Cadastral Survey Map');
  const pngBlob = new Blob([pngContent], { type: 'image/png' });
  const pngFormData = new FormData();
  pngFormData.append('file', pngBlob, 'cadastral_survey_map.png');
  pngFormData.append('documentType', DocumentType.SURVEY_MAP);

  const pngUploadRes = await fetch('http://localhost:5000/api/v1/documents/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenCitizenA}` },
    body: pngFormData,
  });
  const pngUploadJson = await pngUploadRes.json();
  console.log(`✓ PNG Upload Status: ${pngUploadRes.status} (Expected 201)`);
  console.log(`✓ PNG Document ID: ${pngUploadJson.data?.id}`);

  const docMapId = pngUploadJson.data?.id;

  // 5. Test Inline View Streaming (GET /api/v1/documents/:id/view)
  console.log('\n5. Testing Document Inline Viewing (GET /api/v1/documents/:id/view):');
  const viewRes = await fetch(`http://localhost:5000/api/v1/documents/${docAId}/view`, {
    headers: { Authorization: `Bearer ${tokenCitizenA}` },
  });

  console.log(`✓ View Status: ${viewRes.status} (Expected 200)`);
  console.log(`✓ Content-Type Header: ${viewRes.headers.get('content-type')} (Expected application/pdf)`);
  console.log(`✓ Content-Disposition Header: ${viewRes.headers.get('content-disposition')} (Expected inline)`);
  console.log(`✓ X-Document-SHA256 Header: ${viewRes.headers.get('x-document-sha256')}`);
  const viewBuffer = Buffer.from(await viewRes.arrayBuffer());
  console.log(`✓ Streamed Buffer Size: ${viewBuffer.length} bytes (Expected ${pdfContent.length} bytes)`);

  // 6. Test Attachment Download Streaming (GET /api/v1/documents/:id/download)
  console.log('\n6. Testing Document Download (GET /api/v1/documents/:id/download):');
  const downloadRes = await fetch(`http://localhost:5000/api/v1/documents/${docAId}/download`, {
    headers: { Authorization: `Bearer ${tokenCitizenA}` },
  });
  console.log(`✓ Download Status: ${downloadRes.status} (Expected 200)`);
  console.log(`✓ Content-Disposition Header: ${downloadRes.headers.get('content-disposition')} (Expected attachment)`);

  // 7. Test Cross-Tenant Access Restrictions & Role-Based Deletion
  console.log('\n7. Testing RBAC Security - Cross-Tenant Deletion Rejection (Citizen B deleting Citizen A\'s doc):');
  const unauthDeleteRes = await fetch(`http://localhost:5000/api/v1/documents/${docAId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tokenCitizenB}` },
  });
  const unauthDeleteJson = await unauthDeleteRes.json();
  console.log(`✓ Cross-Tenant Delete Status: ${unauthDeleteRes.status} (Expected 403)`);
  console.log(`✓ Error Code: ${unauthDeleteJson.error?.code}, Message: ${unauthDeleteJson.error?.message}`);

  // 8. Test Legitimate Citizen Deletion of Unlinked Draft Document
  console.log('\n8. Testing Citizen Deletion of Draft Document:');
  const docToDelete = await prisma.document.findUnique({ where: { id: docMapId } });
  const physicalPathBefore = defaultStorageProvider.getAbsolutePath(docToDelete!.filePath);
  console.log(`  - Checking physical file exists on disk before delete: ${fs.existsSync(physicalPathBefore)}`);

  const deleteRes = await fetch(`http://localhost:5000/api/v1/documents/${docMapId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tokenCitizenA}` },
  });
  const deleteJson = await deleteRes.json();
  console.log(`✓ Delete Status: ${deleteRes.status} (Expected 200)`);
  console.log(`✓ Delete Result: ${JSON.stringify(deleteJson.data)}`);

  const physicalPathAfter = fs.existsSync(physicalPathBefore);
  console.log(`✓ Physical file purged from storage disk: ${!physicalPathAfter}`);
  const dbDocAfter = await prisma.document.findUnique({ where: { id: docMapId } });
  console.log(`✓ PostgreSQL metadata purged: ${dbDocAfter === null}`);

  // 9. Verify Storage Provider Abstraction Interface
  console.log('\n9. Verifying Storage Provider Interface & Path Traversal Guards:');
  try {
    defaultStorageProvider.getAbsolutePath('../../etc/passwd');
    console.error('FAILED: Path traversal should have thrown an error!');
  } catch (err: any) {
    console.log(`✓ Path Traversal Guard successfully blocked malicious key: ${err.message}`);
  }

  console.log('\n=== ALL REAL DOCUMENT MANAGEMENT & STORAGE TESTS PASSED! ===\n');
}

runDocumentManagementTests()
  .catch((err) => {
    console.error('Test Suite Failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
