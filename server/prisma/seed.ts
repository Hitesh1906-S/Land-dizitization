import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting BhoomiSetu database seeding...');

  // Hash password for default users
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Password@123', salt);

  // 1. Create Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@bhoomisetu.gov.in' },
    update: {},
    create: {
      email: 'admin@bhoomisetu.gov.in',
      fullName: 'Chief Land Administrator',
      passwordHash,
      role: 'ADMIN',
      phone: '+91 9800000001',
    },
  });

  // 2. Create Revenue Officer
  const officer = await prisma.user.upsert({
    where: { email: 'officer.jaipur@bhoomisetu.gov.in' },
    update: {},
    create: {
      email: 'officer.jaipur@bhoomisetu.gov.in',
      fullName: 'Raman Sharma (Tehsildar)',
      passwordHash,
      role: 'REVENUE_OFFICER',
      phone: '+91 9800000002',
      jurisdictionDistrict: 'Jaipur',
      jurisdictionTehsil: 'Sanganer',
    },
  });

  // 3. Create Citizen
  const citizen = await prisma.user.upsert({
    where: { email: 'citizen@example.com' },
    update: {},
    create: {
      email: 'citizen@example.com',
      fullName: 'Ram Kumar Sharma',
      passwordHash,
      role: 'CITIZEN',
      phone: '+91 9800000003',
    },
  });

  console.log('✅ Seeded Users:');
  console.log(` - Admin: ${admin.email} / Password@123`);
  console.log(` - Officer: ${officer.email} / Password@123`);
  console.log(` - Citizen: ${citizen.email} / Password@123`);

  // 4. Create Sample Land Record with Geometry
  const samplePolygon = {
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

  const record = await prisma.landRecord.upsert({
    where: { ulpin: 'RJ-JP-2024-8841' },
    update: {},
    create: {
      ulpin: 'RJ-JP-2024-8841',
      khasraNumber: '102/4',
      khatauniNumber: '45-B',
      district: 'Jaipur',
      tehsil: 'Sanganer',
      village: 'Rampur',
      areaInSqMeters: 4050,
      areaUnit: 'SQ_METERS',
      landType: 'AGRICULTURAL',
      status: 'VERIFIED',
      createdById: officer.id,
      owners: {
        create: [
          {
            ownerName: 'Ram Kumar Sharma',
            relationType: 'S/O Mohan Lal',
            shareFraction: 1.0,
            isPrimary: true,
          },
        ],
      },
      geometry: {
        create: {
          geometryJson: JSON.stringify(samplePolygon),
          centroidLat: 26.913,
          centroidLng: 75.785,
          crsProjection: 'EPSG:4326',
        },
      },
    },
  });

  console.log(`✅ Seeded Land Record: ULPIN ${record.ulpin} (Khasra ${record.khasraNumber})`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
