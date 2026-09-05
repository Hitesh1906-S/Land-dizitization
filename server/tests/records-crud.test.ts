import http from 'http';
import { createApp } from '../src/app';
import { prisma } from '../src/config/database';
import { RecordStatus, LandType, AreaUnit, UserRole } from '@land-digitization/shared';

async function testRecordsCrud() {
  console.log('=== STARTING LAND RECORD MODULE CRUD & SEARCH TEST SUITE ===\n');

  const app = createApp();
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address() as any;
  const baseUrl = `http://127.0.0.1:${address.port}/api/v1`;

  try {
    // 1. Authenticate Revenue Officer
    console.log('1. Authenticating Revenue Officer:');
    const officerLogin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'officer.jaipur@bhoomisetu.gov.in',
        password: 'Password@123',
      }),
    });
    const officerBody: any = await officerLogin.json();
    const officerToken = officerBody.data?.token;
    console.log(`✓ Officer Authenticated: ${officerBody.data?.user?.fullName}`);

    // Authenticate Citizen
    const citizenLogin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'citizen@example.com',
        password: 'Password@123',
      }),
    });
    const citizenBody: any = await citizenLogin.json();
    const citizenToken = citizenBody.data?.token;
    console.log(`✓ Citizen Authenticated: ${citizenBody.data?.user?.fullName}`);

    // 2. Test Server-side Search with Filters
    console.log('\n2. Testing Server-side Record Filtering (Village=Rampur, District=Jaipur):');
    const searchRes1 = await fetch(`${baseUrl}/records?district=Jaipur&village=Rampur`);
    const searchBody1: any = await searchRes1.json();
    console.log(`✓ Status: ${searchRes1.status} (Expected 200)`);
    console.log(`✓ Records matched: ${searchBody1.data?.length}, Total: ${searchBody1.pagination?.total}`);
    if (searchRes1.status !== 200 || !searchBody1.data) {
      throw new Error('Search by location filters failed');
    }

    // 3. Test Owner Name Substring Filter
    console.log('\n3. Testing Owner Name Substring Filter (Owner=Ram Kumar):');
    const searchRes2 = await fetch(`${baseUrl}/records?owner=Ram%20Kumar`);
    const searchBody2: any = await searchRes2.json();
    console.log(`✓ Status: ${searchRes2.status}`);
    console.log(`✓ Records matched: ${searchBody2.data?.length}`);
    const matchedOwner = searchBody2.data?.[0]?.owners?.find((o: any) => o.fullName.includes('Ram Kumar'));
    console.log(`✓ Found owner: ${matchedOwner?.fullName}`);
    if (!matchedOwner) {
      throw new Error('Owner filter did not return expected matching record');
    }

    // 4. Test Sorting & Pagination
    console.log('\n4. Testing Server-side Sorting & Pagination:');
    const pageRes = await fetch(`${baseUrl}/records?sortBy=areaInSqMeters&sortOrder=desc&page=1&limit=2`);
    const pageBody: any = await pageRes.json();
    console.log(`✓ Page 1 results count: ${pageBody.data?.length} (Limit: 2)`);
    console.log(`✓ Total Pages: ${pageBody.pagination?.totalPages}, Total: ${pageBody.pagination?.total}`);
    console.log(`✓ Record 1 Area: ${pageBody.data?.[0]?.areaInSqMeters} sq.m, Record 2 Area: ${pageBody.data?.[1]?.areaInSqMeters} sq.m`);
    if (pageBody.data?.length > 2) {
      throw new Error('Pagination limit was not respected');
    }

    // 5. Create a New Land Record (Revenue Officer)
    console.log('\n5. Testing Create Land Record (POST /api/v1/records):');
    const testUlpin = `RJ-08-SAN-${Date.now()}`;
    const testKhasra = `888/${Math.floor(Date.now() % 500)}`;
    const createRes = await fetch(`${baseUrl}/records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${officerToken}`,
      },
      body: JSON.stringify({
        ulpin: testUlpin,
        khasraNumber: testKhasra,
        khatauniNumber: '112-X',
        district: 'Jaipur',
        tehsil: 'Sanganer',
        village: 'Rampur',
        areaInSqMeters: 6200.0,
        areaUnit: AreaUnit.SQ_METERS,
        landType: LandType.COMMERCIAL,
        owners: [
          {
            fullName: 'Manish Choudhary',
            relationType: 'S/O',
            guardianName: 'Rameshwar Choudhary',
            shareFraction: 1.0,
            isPrimary: true,
            address: 'Plot 14, Sanganer, Jaipur',
          },
        ],
        parcel: {
          centroidLat: 26.814,
          centroidLng: 75.792,
          geometryJson: {
            type: 'Polygon',
            coordinates: [
              [
                [75.791, 26.813],
                [75.793, 26.813],
                [75.793, 26.815],
                [75.791, 26.815],
                [75.791, 26.813],
              ],
            ],
          },
        },
      }),
    });
    const createBody: any = await createRes.json();
    console.log(`✓ Creation Status: ${createRes.status} (Expected 201)`);
    console.log(`✓ Created Record ULPIN: ${createBody.data?.ulpin}, ID: ${createBody.data?.id}`);
    const createdRecordId = createBody.data?.id;
    if (createRes.status !== 201 || !createdRecordId) {
      throw new Error(`Failed to create land record: ${createBody.error?.message}`);
    }

    // 6. Read Detailed Dossier by ID (GET /api/v1/records/:id)
    console.log('\n6. Testing Get Record Dossier by ID (GET /api/v1/records/:id):');
    const getRes = await fetch(`${baseUrl}/records/${createdRecordId}`);
    const getBody: any = await getRes.json();
    console.log(`✓ Retrieve Status: ${getRes.status} (Expected 200)`);
    console.log(`✓ Khasra: ${getBody.data?.khasraNumber}, Owners: ${getBody.data?.owners?.length}, Status: ${getBody.data?.status}`);
    if (getRes.status !== 200 || getBody.data?.id !== createdRecordId) {
      throw new Error('Failed to retrieve record dossier by ID');
    }

    // 7. Update Record Status & Details (PATCH /api/v1/records/:id)
    console.log('\n7. Testing Update Land Record Status (PATCH /api/v1/records/:id):');
    const updateRes = await fetch(`${baseUrl}/records/${createdRecordId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${officerToken}`,
      },
      body: JSON.stringify({
        status: RecordStatus.VERIFIED,
        landType: LandType.COMMERCIAL,
      }),
    });
    const updateBody: any = await updateRes.json();
    console.log(`✓ Update Status: ${updateRes.status} (Expected 200)`);
    console.log(`✓ New Status in response: ${updateBody.data?.status} (Expected VERIFIED)`);
    if (updateRes.status !== 200 || updateBody.data?.status !== RecordStatus.VERIFIED) {
      throw new Error('Failed to update land record status');
    }

    // 8. Test RBAC Guard: Citizen Attempting Create (403 Forbidden)
    console.log('\n8. Testing RBAC Guard - Citizen attempting Record Creation (403 Forbidden):');
    const rbacRes = await fetch(`${baseUrl}/records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${citizenToken}`,
      },
      body: JSON.stringify({
        ulpin: `RJ-UNAUTH-${Date.now()}`,
        khasraNumber: '999',
        khatauniNumber: '999',
        district: 'Jaipur',
        village: 'Rampur',
        areaInSqMeters: 1000,
        owners: [{ fullName: 'Unauthorized Citizen' }],
      }),
    });
    const rbacBody: any = await rbacRes.json();
    console.log(`✓ RBAC Status: ${rbacRes.status} (Expected 403)`);
    console.log(`✓ Error Code: ${rbacBody.error?.code}, Message: ${rbacBody.error?.message}`);
    if (rbacRes.status !== 403 || rbacBody.error?.code !== 'FORBIDDEN') {
      throw new Error('Expected 403 Forbidden for citizen record creation');
    }

    console.log('\n=== ALL LAND RECORD CRUD, SEARCH, FILTER & RBAC TESTS PASSED! ===');
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

testRecordsCrud()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('RECORDS TEST FAILED:', err);
    process.exit(1);
  });
