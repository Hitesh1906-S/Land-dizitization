import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding BhoomiSetu Persistent Data Layer (All 15 Normalized Models)...');

  // Clean existing tables in reverse relational order
  await prisma.auditLog.deleteMany();
  await prisma.validationIssue.deleteMany();
  await prisma.validationResult.deleteMany();
  await prisma.duplicateCandidate.deleteMany();
  await prisma.extractedField.deleteMany();
  await prisma.oCRResult.deleteMany();
  await prisma.document.deleteMany();
  await prisma.request.deleteMany();
  await prisma.ownershipHistory.deleteMany();
  await prisma.parcel.deleteMany();
  await prisma.owner.deleteMany();
  await prisma.landRecord.deleteMany();
  await prisma.location.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();

  // 1. Roles
  const adminRole = await prisma.role.create({
    data: {
      name: 'ADMIN',
      description: 'National System Administrator with full jurisdictional audit & user management access',
      permissions: JSON.stringify(['*']),
    },
  });

  const officerRole = await prisma.role.create({
    data: {
      name: 'REVENUE_OFFICER',
      description: 'Tehsildar / Patwari / Revenue Inspector with deed verification and dispute resolution authority',
      permissions: JSON.stringify(['records:verify', 'conflicts:resolve', 'mutations:approve', 'ocr:audit']),
    },
  });

  const citizenRole = await prisma.role.create({
    data: {
      name: 'CITIZEN',
      description: 'Land owner or applicant with deed digitization, public search, and mutation filing access',
      permissions: JSON.stringify(['records:read_own', 'requests:create', 'documents:upload']),
    },
  });

  console.log('✅ 1. Seeded Roles: ADMIN, REVENUE_OFFICER, CITIZEN');

  // 2. Users
  const passwordHash = await bcrypt.hash('Password@123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@bhoomisetu.gov.in',
      passwordHash,
      fullName: 'Chief Land Administrator',
      phone: '+91 9800000001',
      roleId: adminRole.id,
      roleName: 'ADMIN',
      isActive: true,
    },
  });

  const officer = await prisma.user.create({
    data: {
      email: 'officer.jaipur@bhoomisetu.gov.in',
      passwordHash,
      fullName: 'Raman Sharma (Tehsildar)',
      phone: '+91 9800000002',
      roleId: officerRole.id,
      roleName: 'REVENUE_OFFICER',
      jurisdictionDistrict: 'Jaipur',
      jurisdictionTehsil: 'Sanganer',
      isActive: true,
    },
  });

  const citizen1 = await prisma.user.create({
    data: {
      email: 'citizen@example.com',
      passwordHash,
      fullName: 'Ram Kumar Sharma',
      phone: '+91 9800000003',
      roleId: citizenRole.id,
      roleName: 'CITIZEN',
      isActive: true,
    },
  });

  const citizen2 = await prisma.user.create({
    data: {
      email: 'suresh.verma@example.com',
      passwordHash,
      fullName: 'Suresh Verma',
      phone: '+91 9800000004',
      roleId: citizenRole.id,
      roleName: 'CITIZEN',
      isActive: true,
    },
  });

  console.log('✅ 2. Seeded Users (Admin, Officer Raman Sharma, Citizens Ram Kumar Sharma & Suresh Verma)');

  // 3. Location
  const locationRampur = await prisma.location.create({
    data: {
      state: 'Rajasthan',
      district: 'Jaipur',
      tehsil: 'Sanganer',
      subDivision: 'Jaipur South',
      village: 'Rampur',
      censusCode: 'RJ-08-019-00452',
      pincode: '302029',
    },
  });

  const locationAmer = await prisma.location.create({
    data: {
      state: 'Rajasthan',
      district: 'Jaipur',
      tehsil: 'Amer',
      subDivision: 'Jaipur North',
      village: 'Amer Rural',
      censusCode: 'RJ-08-019-00118',
      pincode: '302028',
    },
  });

  console.log('✅ 3. Seeded Locations (Rampur Village in Sanganer & Amer Rural)');

  // 4. LandRecords
  const record1 = await prisma.landRecord.create({
    data: {
      ulpin: 'RJ-JP-2024-8841',
      khasraNumber: '102/4',
      khatauniNumber: '45-B',
      locationId: locationRampur.id,
      areaInSqMeters: 4050,
      areaUnit: 'SQ_METERS',
      landType: 'AGRICULTURAL',
      status: 'VERIFIED',
      createdById: officer.id,
    },
  });

  const record2 = await prisma.landRecord.create({
    data: {
      ulpin: 'RJ-JP-2024-8842',
      khasraNumber: '102/5',
      khatauniNumber: '45-C',
      locationId: locationRampur.id,
      areaInSqMeters: 3200,
      areaUnit: 'SQ_METERS',
      landType: 'AGRICULTURAL',
      status: 'DISPUTED',
      createdById: officer.id,
    },
  });

  const record3 = await prisma.landRecord.create({
    data: {
      ulpin: 'RJ-JP-2024-9120',
      khasraNumber: '103/1',
      khatauniNumber: '48-A',
      locationId: locationAmer.id,
      areaInSqMeters: 5500,
      areaUnit: 'SQ_METERS',
      landType: 'RESIDENTIAL',
      status: 'PENDING_VERIFICATION',
      createdById: officer.id,
    },
  });

  console.log('✅ 4. Seeded Land Records (ULPIN 8841, 8842, 9120)');

  // 5. Owners
  await prisma.owner.create({
    data: {
      landRecordId: record1.id,
      fullName: 'Ram Kumar Sharma',
      relationType: 'S/O',
      guardianName: 'Mohan Lal Sharma',
      identifierMasked: 'XXXX-XXXX-8912',
      shareFraction: 1.0,
      isPrimary: true,
      mobileNumber: '+91 9800000003',
      address: 'House No 14, Main Road, Rampur, Jaipur',
    },
  });

  await prisma.owner.create({
    data: {
      landRecordId: record2.id,
      fullName: 'Suresh Verma',
      relationType: 'S/O',
      guardianName: 'Gopal Verma',
      identifierMasked: 'XXXX-XXXX-4421',
      shareFraction: 1.0,
      isPrimary: true,
      mobileNumber: '+91 9800000004',
      address: 'Plot 22, Patel Nagar, Rampur, Jaipur',
    },
  });

  console.log('✅ 5. Seeded Land Owners with Share Fractions');

  // 6. Ownership History
  await prisma.ownershipHistory.create({
    data: {
      landRecordId: record1.id,
      previousOwnerName: 'Mohan Lal Sharma',
      newOwnerName: 'Ram Kumar Sharma',
      mutationType: 'INHERITANCE',
      mutationOrderNumber: 'MUT-SANCTION-2024-0012',
      mutationDate: new Date('2024-03-15'),
      transferredShare: 1.0,
      recordedById: officer.id,
    },
  });

  console.log('✅ 6. Seeded Ownership History Chain of Title');

  // 7. Parcels (GeoJSON Cadastral Geometries)
  const geomRecord1 = {
    type: 'Polygon',
    coordinates: [
      [
        [75.783, 26.911],
        [75.787, 26.911],
        [75.787, 26.915],
        [75.783, 26.915],
        [75.783, 26.911],
      ],
    ],
  };

  const geomRecord2 = {
    type: 'Polygon',
    coordinates: [
      [
        [75.7865, 26.913],
        [75.791, 26.913],
        [75.791, 26.917],
        [75.7865, 26.917],
        [75.7865, 26.913],
      ],
    ],
  };

  await prisma.parcel.create({
    data: {
      landRecordId: record1.id,
      geometryJson: JSON.stringify(geomRecord1),
      centroidLat: 26.913,
      centroidLng: 75.785,
      crsProjection: 'EPSG:4326',
      boundaryHash: 'b45f91e0a2938d8172c72b',
      northBoundary: 'Khasra 101 (Village Pond)',
      southBoundary: 'Panchayat Road (12m)',
      eastBoundary: 'Khasra 102/5 (Suresh Verma)',
      westBoundary: 'Khasra 102/3 (Govt Canal)',
    },
  });

  await prisma.parcel.create({
    data: {
      landRecordId: record2.id,
      geometryJson: JSON.stringify(geomRecord2),
      centroidLat: 26.915,
      centroidLng: 75.7885,
      crsProjection: 'EPSG:4326',
      boundaryHash: 'c7819ae022910fa899120e',
      northBoundary: 'Khasra 101',
      southBoundary: 'Panchayat Road',
      eastBoundary: 'Khasra 102/6',
      westBoundary: 'Khasra 102/4 (Ram Kumar)',
    },
  });

  console.log('✅ 7. Seeded Cadastral Parcels (GeoJSON polygons with boundary bounding)');

  // 8. Documents
  const docDeed = await prisma.document.create({
    data: {
      landRecordId: record1.id,
      fileName: 'Sale_Deed_Khasra_102_4_Registered.pdf',
      fileType: 'application/pdf',
      filePath: './uploads/Sale_Deed_Khasra_102_4.pdf',
      fileSize: 2048576,
      fileHash: '4f8b91a27e3d09c81b2c45e8a9f0d1e2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8',
      documentType: 'REGISTRATION_DEED',
      uploadedById: citizen1.id,
    },
  });

  console.log('✅ 8. Seeded Documents with SHA-256 Checksums');

  // 9. OCR Results
  const ocrResult = await prisma.oCRResult.create({
    data: {
      documentId: docDeed.id,
      status: 'COMPLETED',
      rawText: 'विक्रय पत्र (Sale Deed) - खसरा संख्या: 102/4, खाता संख्या: 45-B, ग्राम: रामपुर, तहसील: सांगानेर, जिला: जयपुर, कुल रकबा: 4050 वर्ग मीटर, क्रेता: राम कुमार शर्मा सुपुत्र मोहन लाल शर्मा।',
      confidenceScore: 94.5,
      engine: 'GEMINI_VISION',
      pageCount: 3,
      processingTimeMs: 1420,
      completedAt: new Date(),
    },
  });

  // 10. Extracted Fields
  await prisma.extractedField.createMany({
    data: [
      {
        ocrResultId: ocrResult.id,
        fieldName: 'khasraNumber',
        fieldValue: '102/4',
        confidence: 0.98,
        isVerified: true,
        verifiedValue: '102/4',
        verifiedById: officer.id,
      },
      {
        ocrResultId: ocrResult.id,
        fieldName: 'khatauniNumber',
        fieldValue: '45-B',
        confidence: 0.96,
        isVerified: true,
        verifiedValue: '45-B',
        verifiedById: officer.id,
      },
      {
        ocrResultId: ocrResult.id,
        fieldName: 'ownerName',
        fieldValue: 'Ram Kumar Sharma s/o Mohan Lal Sharma',
        confidence: 0.94,
        isVerified: true,
        verifiedValue: 'Ram Kumar Sharma',
        verifiedById: officer.id,
      },
      {
        ocrResultId: ocrResult.id,
        fieldName: 'areaInSqMeters',
        fieldValue: '4050',
        confidence: 0.99,
        isVerified: true,
        verifiedValue: '4050',
        verifiedById: officer.id,
      },
    ],
  });

  console.log('✅ 9 & 10. Seeded OCR Results & Verified Extracted Fields');

  // 11. Validation Results & 12. Validation Issues
  const valResult = await prisma.validationResult.create({
    data: {
      landRecordId: record1.id,
      isValid: false,
      overallScore: 82.0,
      summary: 'Khasra syntax and owner shares verified (100%). Flagged 502 m² spatial boundary overlap with neighboring parcel 102/5.',
      executedById: officer.id,
    },
  });

  await prisma.validationIssue.createMany({
    data: [
      {
        validationResultId: valResult.id,
        ruleCode: 'SHARE_SUM_MISMATCH',
        severity: 'INFO',
        title: 'Ownership Share Sum Integrity',
        description: 'Total owner shares equal 1.0 (100.0%). Mathematical check passed.',
        detailsJson: JSON.stringify({ totalShare: 1.0, ownerCount: 1 }),
        isResolved: true,
        resolvedById: officer.id,
        resolvedAt: new Date(),
      },
      {
        validationResultId: valResult.id,
        ruleCode: 'SPATIAL_OVERLAP',
        severity: 'CRITICAL',
        title: 'Spatial Boundary Encroachment',
        description: 'Detected 502 sq.m (12.4%) boundary intersection with Khasra No 102/5.',
        detailsJson: JSON.stringify({ conflictingKhasra: '102/5', overlapArea: 502.4, overlapPct: 12.4 }),
        isResolved: false,
      },
    ],
  });

  console.log('✅ 11 & 12. Seeded Validation Results & Validation Issues');

  // 13. Duplicate Candidate (Conflict)
  await prisma.duplicateCandidate.create({
    data: {
      primaryRecordId: record1.id,
      conflictingRecordId: record2.id,
      conflictType: 'SPATIAL_OVERLAP',
      overlapPercentage: 12.4,
      overlapAreaSqM: 502.4,
      status: 'INVESTIGATING',
      resolutionNotes: 'Field measurement notice dispatched to Patwari for on-site boundary pegging.',
      createdAt: new Date(),
    },
  });

  console.log('✅ 13. Seeded DuplicateCandidate (Spatial Overlap Dispute)');

  // 14. Mutation / Digitization Request
  const mutationReq = await prisma.request.create({
    data: {
      applicationNumber: 'MUT-2026-928104',
      landRecordId: record1.id,
      applicantId: citizen1.id,
      requestType: 'SALE_MUTATION',
      stage: 'DOCUMENT_VERIFICATION',
      assignedOfficerId: officer.id,
      metadataJson: JSON.stringify({
        saleDeedRegistrationNo: 'REG-2024-JP-9941',
        saleConsiderationINR: 2450000,
        stampDutyPaid: true,
      }),
    },
  });

  // Link document to request
  await prisma.document.update({
    where: { id: docDeed.id },
    data: { requestId: mutationReq.id },
  });

  console.log('✅ 14. Seeded Mutation Request (MUT-2026-928104)');

  // 15. Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        actorId: officer.id,
        actorRole: 'REVENUE_OFFICER',
        action: 'CREATE',
        entityType: 'LandRecord',
        entityId: record1.id,
        ipAddress: '192.168.1.10',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        snapshotDiffJson: JSON.stringify({ ulpin: 'RJ-JP-2024-8841', khasraNumber: '102/4' }),
        timestamp: new Date('2026-09-01T09:00:00Z'),
      },
      {
        actorId: citizen1.id,
        actorRole: 'CITIZEN',
        action: 'CREATE',
        entityType: 'Document',
        entityId: docDeed.id,
        ipAddress: '192.168.1.102',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        snapshotDiffJson: JSON.stringify({ fileName: 'Sale_Deed_Khasra_102_4.pdf', fileHash: docDeed.fileHash }),
        timestamp: new Date('2026-09-02T10:30:00Z'),
      },
      {
        actorId: officer.id,
        actorRole: 'REVENUE_OFFICER',
        action: 'RUN_OCR',
        entityType: 'OCRResult',
        entityId: ocrResult.id,
        ipAddress: '192.168.1.10',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        snapshotDiffJson: JSON.stringify({ confidenceScore: 94.5, engine: 'GEMINI_VISION' }),
        timestamp: new Date('2026-09-02T10:32:00Z'),
      },
    ],
  });

  console.log('✅ 15. Seeded Immutable Audit Trail Logs');
  console.log('🎉 All 15 Normalized Models Seeded Successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
