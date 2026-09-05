import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../src/config/database';
import { GisService } from '../src/services/gis.service';
import { UserRole } from '../src/constants/index';

describe('Cadastral GIS Mapping & Spatial Parcel Module', () => {
  let officerId: string;
  let locationId: string;
  let parcelRecordId: string;
  let parcelId: string;

  before(async () => {
    // 1. Create Officer User
    const officer = await prisma.user.create({
      data: {
        email: `officer-gis-${Date.now()}@revenue.gov.in`,
        passwordHash: 'hashed_secret',
        fullName: 'Shri Manoj Gehlot (GIS Director)',
        roleName: UserRole.REVENUE_OFFICER,
      },
    });
    officerId = officer.id;

    // 2. Create Location
    const loc = await prisma.location.create({
      data: {
        state: 'Rajasthan',
        district: 'Jaipur',
        tehsil: 'Sanganer',
        village: `GisVillage_${Date.now()}`,
        censusCode: 'GIS-001',
      },
    });
    locationId = loc.id;

    // 3. Create LandRecord with connected Parcel Geometry
    const polyGeometry = {
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

    const record = await prisma.landRecord.create({
      data: {
        ulpin: `ULPIN-GIS-${Date.now()}`,
        locationId,
        khasraNumber: '501/2',
        khatauniNumber: 'KH-501',
        areaInSqMeters: 4000,
        areaUnit: 'SQ_METERS',
        landType: 'AGRICULTURAL',
        status: 'VERIFIED',
        createdById: officerId,
        owners: {
          create: [
            {
              fullName: 'Bhanwar Singh',
              shareFraction: 1.0,
              isPrimary: true,
            },
          ],
        },
        parcel: {
          create: {
            geometryJson: JSON.stringify(polyGeometry),
            centroidLat: 26.913,
            centroidLng: 75.785,
            crsProjection: 'EPSG:4326',
          },
        },
      },
      include: {
        parcel: true,
      },
    });

    parcelRecordId = record.id;
    parcelId = record.parcel!.id;

    // 4. Attach ValidationResult
    await prisma.validationResult.create({
      data: {
        landRecordId: record.id,
        isValid: true,
        overallScore: 100,
        summary: 'Fully validated parcel',
        executedById: officerId,
      },
    });
  });

  describe('1. GeoJSON Generation & LandRecord Association', () => {
    it('should generate valid GeoJSON FeatureCollection with connected LandRecord metadata', async () => {
      const geojson = await GisService.getVillageParcelsGeoJSON({ locationId });

      assert.equal(geojson.type, 'FeatureCollection');
      assert.ok(geojson.features.length >= 1);

      const feature = geojson.features.find((f: any) => f.properties?.recordId === parcelRecordId);
      assert.ok(feature !== undefined, 'Target parcel feature must exist in FeatureCollection');

      assert.equal(feature?.type, 'Feature');
      assert.equal(feature?.geometry?.type, 'Polygon');
      assert.equal(feature?.properties?.khasraNumber, '501/2');
      assert.equal(feature?.properties?.primaryOwner, 'Bhanwar Singh');
      assert.equal(feature?.properties?.validationStatus, 'PASSED');
      assert.equal(feature?.properties?.validationScore, 100);
      assert.equal(feature?.properties?.areaInSqMeters, 4000);
      assert.ok((feature as any)?.bbox && (feature as any).bbox.length === 4);
    });
  });

  describe('2. Multi-Criteria Spatial & Attribute Filters', () => {
    it('should filter parcels by Khasra number', async () => {
      const geojson = await GisService.getVillageParcelsGeoJSON({
        locationId,
        khasraNumber: '501/2',
      });

      assert.ok(geojson.features.length >= 1);
      assert.equal(geojson.features[0].properties?.khasraNumber, '501/2');
    });

    it('should filter parcels by validation status', async () => {
      const passedGeojson = await GisService.getVillageParcelsGeoJSON({
        locationId,
        validationStatus: 'PASSED',
      });
      assert.ok(passedGeojson.features.length >= 1);

      const failedGeojson = await GisService.getVillageParcelsGeoJSON({
        locationId,
        validationStatus: 'FAILED',
      });
      assert.equal(failedGeojson.features.length, 0);
    });

    it('should search across owners, ULPIN, and Khasra', async () => {
      const searchRes = await GisService.getVillageParcelsGeoJSON({
        search: 'Bhanwar Singh',
      });
      assert.ok(searchRes.features.length >= 1);
      assert.equal(searchRes.features[0].properties?.primaryOwner, 'Bhanwar Singh');
    });
  });

  describe('3. Single Parcel Lookup & Turf Computation', () => {
    it('should retrieve single parcel by ID with deep relations', async () => {
      const parcel = await GisService.getParcelById(parcelId);

      assert.ok(parcel !== null);
      assert.equal(parcel?.id, parcelId);
      assert.equal(parcel?.landRecord?.khasraNumber, '501/2');
      assert.equal(parcel?.landRecord?.owners[0]?.fullName, 'Bhanwar Singh');
    });

    it('should compute centroid and area correctly using Turf.js', async () => {
      const poly = {
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

      const result = await GisService.computeCentroidAndArea(poly);

      assert.ok(result.centroidLng > 75.78 && result.centroidLng < 75.79);
      assert.ok(result.centroidLat > 26.91 && result.centroidLat < 26.92);
      assert.ok(result.areaInSqMeters > 0);
    });
  });
});
