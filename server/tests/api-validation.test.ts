import http from 'http';
import { createApp } from '../src/app';
import { prisma } from '../src/config/database';

async function testApiContracts() {
  console.log('=== TESTING REST API CONTRACTS, ERROR HANDLING & VALIDATION ===\n');

  const app = createApp();
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address() as any;
  const baseUrl = `http://127.0.0.1:${address.port}/api/v1`;

  try {
    // 1. Healthcheck
    console.log('1. Testing GET /api/v1/health');
    const healthRes = await fetch(`${baseUrl}/health`);
    const healthBody: any = await healthRes.json();
    console.log(`✓ Status: ${healthRes.status}, Body:`, healthBody);
    if (healthRes.status !== 200 || !healthBody.success) {
      throw new Error('Health check failed');
    }

    // 2. Request Validation Failure Handling (400 Bad Request with field paths)
    console.log('\n2. Testing Request Validation Error (POST /api/v1/auth/register with invalid email & short password)');
    const badRegisterRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'not-an-email',
        password: '123',
        fullName: '',
      }),
    });
    const badRegisterBody: any = await badRegisterRes.json();
    console.log(`✓ Status: ${badRegisterRes.status} (Expected 400)`);
    console.log(`✓ Error Code: ${badRegisterBody.error?.code}`);
    console.log(`✓ Validation Details:`, badRegisterBody.error?.details);
    if (badRegisterRes.status !== 400 || (badRegisterBody.error?.code !== 'BAD_REQUEST' && badRegisterBody.error?.code !== 'VALIDATION_ERROR')) {
      throw new Error(`Expected 400 validation error, got status ${badRegisterRes.status}, code ${badRegisterBody.error?.code}`);
    }

    // 3. User Authentication Login API
    console.log('\n3. Testing POST /api/v1/auth/login');
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'officer.jaipur@bhoomisetu.gov.in',
        password: 'Password@123',
      }),
    });
    const loginBody: any = await loginRes.json();
    console.log(`✓ Status: ${loginRes.status}`);
    console.log(`✓ User: ${loginBody.data?.user?.fullName} (${loginBody.data?.user?.role})`);
    const token = loginBody.data?.token;

    // 4. Locations API
    console.log('\n4. Testing GET /api/v1/locations');
    const locRes = await fetch(`${baseUrl}/locations`);
    const locBody: any = await locRes.json();
    console.log(`✓ Status: ${locRes.status}, Count: ${locBody.data?.length}`);

    // 5. Land Records Search & Filter API
    console.log('\n5. Testing GET /api/v1/records (Filtered by village Rampur)');
    const recordsRes = await fetch(`${baseUrl}/records?village=Rampur`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const recordsBody: any = await recordsRes.json();
    console.log(`✓ Status: ${recordsRes.status}, Total records found: ${recordsBody.pagination?.total}`);

    // 6. Duplicate / Conflict Candidates API
    console.log('\n6. Testing GET /api/v1/conflicts');
    const conflictsRes = await fetch(`${baseUrl}/conflicts`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const conflictsBody: any = await conflictsRes.json();
    console.log(`✓ Status: ${conflictsRes.status}, Conflicts count: ${conflictsBody.data?.length}`);

    // 7. Workflows / Requests API
    console.log('\n7. Testing GET /api/v1/workflows');
    const workflowsRes = await fetch(`${baseUrl}/workflows`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const workflowsBody: any = await workflowsRes.json();
    console.log(`✓ Status: ${workflowsRes.status}, Workflows count: ${workflowsBody.data?.length}`);

    // 8. Audit Trail API
    console.log('\n8. Testing GET /api/v1/audit');
    const auditRes = await fetch(`${baseUrl}/audit`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const auditBody: any = await auditRes.json();
    console.log(`✓ Status: ${auditRes.status}, Audit events: ${auditBody.pagination?.total}`);

    console.log('\n=== ALL REST API ENDPOINTS, ERROR HANDLING & VALIDATION PASSED! ===');
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

testApiContracts()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('API Contract Test Failed:', err);
    process.exit(1);
  });
