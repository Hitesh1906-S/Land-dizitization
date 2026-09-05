import http from 'http';
import { createApp } from '../src/app';
import { prisma } from '../src/config/database';
import { UserRole } from '@land-digitization/shared';

async function testAuthAndRBAC() {
  console.log('=== STARTING REAL AUTHENTICATION & RBAC TEST SUITE ===\n');

  const app = createApp();
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address() as any;
  const baseUrl = `http://127.0.0.1:${address.port}/api/v1`;

  try {
    // 1. Citizen Self-Registration
    console.log('1. Testing Citizen Registration (POST /api/v1/auth/register):');
    const testEmail = `citizen.test.${Date.now()}@example.com`;
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'Password@123',
        fullName: 'Aakash Verma',
        phone: '+91 9988776655',
        role: UserRole.CITIZEN,
      }),
    });
    const regBody: any = await regRes.json();
    console.log(`✓ Registration status: ${regRes.status} (Expected 201)`);
    console.log(`✓ Registered User: ${regBody.data?.user?.email}, Role: ${regBody.data?.user?.role}`);
    const citizenToken = regBody.data?.token;

    if (regRes.status !== 201 || !citizenToken || regBody.data?.user?.role !== UserRole.CITIZEN) {
      throw new Error('Registration test failed');
    }

    // 2. Duplicate Registration Rejection (400 Bad Request)
    console.log('\n2. Testing Duplicate Registration Prevention:');
    const dupRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'Password@123',
        fullName: 'Duplicate User',
      }),
    });
    const dupBody: any = await dupRes.json();
    console.log(`✓ Duplicate rejection status: ${dupRes.status} (Expected 400)`);
    console.log(`✓ Error Code: ${dupBody.error?.code}, Message: ${dupBody.error?.message}`);
    if (dupRes.status !== 400) {
      throw new Error('Expected duplicate registration to fail with 400');
    }

    // 3. Login with Correct Password
    console.log('\n3. Testing Successful Login (POST /api/v1/auth/login):');
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'Password@123',
      }),
    });
    const loginBody: any = await loginRes.json();
    console.log(`✓ Login status: ${loginRes.status} (Expected 200)`);
    console.log(`✓ Authenticated User: ${loginBody.data?.user?.fullName}`);
    if (loginRes.status !== 200 || !loginBody.data?.token) {
      throw new Error('Login with valid credentials failed');
    }

    // 4. Login with Wrong Password (401 Unauthorized)
    console.log('\n4. Testing Invalid Password Login Rejection (401):');
    const badLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'WrongPassword@999',
      }),
    });
    const badLoginBody: any = await badLoginRes.json();
    console.log(`✓ Status: ${badLoginRes.status} (Expected 401)`);
    console.log(`✓ Error Code: ${badLoginBody.error?.code}, Message: ${badLoginBody.error?.message}`);
    if (badLoginRes.status !== 401 || badLoginBody.error?.code !== 'UNAUTHORIZED') {
      throw new Error('Expected 401 on incorrect password');
    }

    // 5. Current-User Session Profile (GET /api/v1/auth/me)
    console.log('\n5. Testing Current User Session (GET /api/v1/auth/me):');
    const meRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${citizenToken}` },
    });
    const meBody: any = await meRes.json();
    console.log(`✓ Session Status: ${meRes.status} (Expected 200)`);
    console.log(`✓ Retrieved Profile: ${meBody.data?.fullName} (${meBody.data?.email})`);
    if (meRes.status !== 200 || meBody.data?.email !== testEmail) {
      throw new Error('Failed to retrieve current user session');
    }

    // 6. Accessing Protected Route without Token (401 Unauthorized)
    console.log('\n6. Testing Unauthenticated Route Access Protection (401):');
    const unauthRes = await fetch(`${baseUrl}/auth/me`);
    const unauthBody: any = await unauthRes.json();
    console.log(`✓ Status: ${unauthRes.status} (Expected 401)`);
    console.log(`✓ Error Code: ${unauthBody.error?.code}`);
    if (unauthRes.status !== 401) {
      throw new Error('Expected unauthenticated request to return 401');
    }

    // 7. Role-Based Authorization Guard (403 Forbidden)
    // Citizen attempts Officer-only Conflict Resolution
    console.log('\n7. Testing RBAC Guard - Citizen attempting Officer Conflict Resolution (403 Forbidden):');
    const forbiddenRes = await fetch(`${baseUrl}/conflicts/sample-conflict-id/resolve`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${citizenToken}`,
      },
      body: JSON.stringify({
        status: 'RESOLVED',
        resolutionNotes: 'Citizen trying unauthorized resolution attempt',
      }),
    });
    const forbiddenBody: any = await forbiddenRes.json();
    console.log(`✓ RBAC Status: ${forbiddenRes.status} (Expected 403)`);
    console.log(`✓ Error Code: ${forbiddenBody.error?.code}, Message: ${forbiddenBody.error?.message}`);
    if (forbiddenRes.status !== 403 || forbiddenBody.error?.code !== 'FORBIDDEN') {
      throw new Error('Expected 403 Forbidden when non-officer attempts protected action');
    }

    // 8. Officer Authentication and RBAC Clearance
    console.log('\n8. Testing Officer Authentication & Clearance:');
    const officerLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'officer.jaipur@bhoomisetu.gov.in',
        password: 'Password@123',
      }),
    });
    const officerLoginBody: any = await officerLoginRes.json();
    const officerToken = officerLoginBody.data?.token;
    console.log(`✓ Officer Authenticated: ${officerLoginBody.data?.user?.fullName} (Role: ${officerLoginBody.data?.user?.role})`);

    // 9. Logout
    console.log('\n9. Testing Logout (POST /api/v1/auth/logout):');
    const logoutRes = await fetch(`${baseUrl}/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${citizenToken}` },
    });
    const logoutBody: any = await logoutRes.json();
    console.log(`✓ Logout Status: ${logoutRes.status} (Expected 200), Result:`, logoutBody.data);
    if (logoutRes.status !== 200 || !logoutBody.data?.loggedOut) {
      throw new Error('Logout endpoint failed');
    }

    console.log('\n=== ALL REAL AUTHENTICATION & RBAC TESTS PASSED SUCCESSFULLY! ===');
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

testAuthAndRBAC()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('AUTH & RBAC TEST FAILED:', err);
    process.exit(1);
  });
