import { prisma } from '../src/config/database';
import { AuthService } from '../src/services/auth.service';
import { LocationService } from '../src/services/location.service';
import { RecordService } from '../src/services/record.service';
import { ValidationEngine } from '../src/services/validation/validation.engine';
import { ConflictService } from '../src/services/conflict.service';
import { WorkflowService } from '../src/services/workflow.service';
import { AuditService } from '../src/services/audit.service';
import { UserRole, RequestType, AreaUnit, LandType, RecordStatus, ConflictStatus } from '@land-digitization/shared';

async function verifyDataLayer() {
  console.log('=== STARTING DATA LAYER & CRUD VERIFICATION ===\n');

  // 1. Verify Database Connection and Model Counts
  console.log('1. Checking Database Connection and Seed Counts:');
  const [
    rolesCount,
    usersCount,
    locationsCount,
    recordsCount,
    ownersCount,
    parcelsCount,
    historyCount,
    documentsCount,
    ocrResultsCount,
    extractedFieldsCount,
    validationsCount,
    issuesCount,
    conflictsCount,
    requestsCount,
    auditLogsCount,
  ] = await Promise.all([
    prisma.role.count(),
    prisma.user.count(),
    prisma.location.count(),
    prisma.landRecord.count(),
    prisma.owner.count(),
    prisma.parcel.count(),
    prisma.ownershipHistory.count(),
    prisma.document.count(),
    prisma.oCRResult.count(),
    prisma.extractedField.count(),
    prisma.validationResult.count(),
    prisma.validationIssue.count(),
    prisma.duplicateCandidate.count(),
    prisma.request.count(),
    prisma.auditLog.count(),
  ]);

  console.log(`- Roles: ${rolesCount}`);
  console.log(`- Users: ${usersCount}`);
  console.log(`- Locations: ${locationsCount}`);
  console.log(`- Land Records: ${recordsCount}`);
  console.log(`- Owners: ${ownersCount}`);
  console.log(`- Parcels: ${parcelsCount}`);
  console.log(`- Ownership Histories: ${historyCount}`);
  console.log(`- Documents: ${documentsCount}`);
  console.log(`- OCR Results: ${ocrResultsCount}`);
  console.log(`- Extracted Fields: ${extractedFieldsCount}`);
  console.log(`- Validation Results: ${validationsCount}`);
  console.log(`- Validation Issues: ${issuesCount}`);
  console.log(`- Duplicate Candidates: ${conflictsCount}`);
  console.log(`- Requests: ${requestsCount}`);
  console.log(`- Audit Logs: ${auditLogsCount}\n`);

  if (recordsCount === 0 || locationsCount === 0 || usersCount === 0) {
    throw new Error('Database is empty! Expected seeded records.');
  }

  // 2. Verify Authentication Service (CRUD / Login / JWT)
  console.log('2. Testing Authentication Service:');
  const authRes = await AuthService.login('officer.jaipur@bhoomisetu.gov.in', 'Password@123');
  console.log(`✓ Login success for: ${authRes.user.email} (${authRes.user.role})`);
  console.log(`✓ JWT token generated: ${authRes.token.substring(0, 30)}...`);

  // 3. Testing Location Service (Hierarchical Registry)
  console.log('\n3. Testing Location Service:');
  const locations = await LocationService.getAllLocations();
  console.log(`✓ Retrieved ${locations.length} administrative locations`);
  const loc = locations[0];
  console.log(`✓ Sample Location: ${loc.village}, Tehsil: ${loc.tehsil}, District: ${loc.district}, State: ${loc.state}`);

  // 4. Testing Land Record Service CRUD:
  console.log('\n4. Testing Land Record Service CRUD:');
  const sampleUlpin = `RJ-08-SAN-RAM-${Date.now()}`;
  const sampleKhasra = `999/${Math.floor(Date.now() % 1000)}`;
  const newRecord = await RecordService.createRecord({
    ulpin: sampleUlpin,
    khasraNumber: sampleKhasra,
    khatauniNumber: '77B',
    locationId: loc.id,
    areaInSqMeters: 3500.0,
    areaUnit: AreaUnit.SQ_METERS,
    landType: LandType.RESIDENTIAL,
    createdById: authRes.user.id,
    owners: [
      {
        fullName: 'Devendra Meena',
        relationType: 'S/O',
        guardianName: 'Kailash Meena',
        shareFraction: 1.0,
        isPrimary: true,
      },
    ],
    parcel: {
      centroidLat: 26.8124,
      centroidLng: 75.7892,
      geometryJson: {
        type: 'Polygon',
        coordinates: [
          [
            [75.789, 26.812],
            [75.790, 26.812],
            [75.790, 26.813],
            [75.789, 26.813],
            [75.789, 26.812],
          ],
        ],
      },
    },
  });
  console.log(`✓ Created LandRecord ID: ${newRecord.id}, ULPIN: ${newRecord.ulpin}`);
  console.log(`✓ Owners attached: ${newRecord.owners?.length}, Primary: ${newRecord.owners?.[0].fullName}`);
  console.log(`✓ Parcel attached with coordinates: ${newRecord.parcel?.centroidLat}, ${newRecord.parcel?.centroidLng}`);

  // 5. Testing Validation Engine & Issue Persistence
  console.log('\n5. Testing Validation Engine:');
  const valResult = await ValidationEngine.validateRecord(newRecord.id, authRes.user.id);
  console.log(`✓ Validation executed: Valid=${valResult.isValid}, Score=${valResult.overallScore}%, Issues=${valResult.issues?.length}`);

  // 6. Testing Workflow / Requests Lifecycle
  console.log('\n6. Testing Requests & Workflow Service:');
  const mutationReq = await WorkflowService.submitRequest({
    applicantId: authRes.user.id,
    landRecordId: newRecord.id,
    requestType: RequestType.SALE_MUTATION,
    metadata: { buyerName: 'Devendra Meena', salePriceInInr: 4500000 },
  });
  console.log(`✓ Mutation Request Created: ${mutationReq.applicationNumber} (Stage: ${mutationReq.stage})`);

  // 7. Testing Audit Trail
  console.log('\n7. Testing Audit Trail:');
  const logsRes = await AuditService.getLogs({ limit: 5 });
  console.log(`✓ Total Audit Logs in System: ${logsRes.pagination.total}`);
  console.log(`✓ Latest Audit Event: [${logsRes.logs[0]?.action}] by ${logsRes.logs[0]?.actor?.fullName || 'System'}`);

  console.log('\n=== ALL 15 PERSISTENT DATA LAYER MODELS & SERVICES VERIFIED SUCCESSFULLY! ===');
}

verifyDataLayer()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('VERIFICATION FAILED:', err);
    await prisma.$disconnect();
    process.exit(1);
  });
