import { prisma } from '../config/database';
import { GeoJSONFeatureCollection } from '@land-digitization/shared';
import * as turf from '@turf/turf';

export class GisService {
  static async getVillageParcelsGeoJSON(filters: {
    district?: string;
    tehsil?: string;
    village?: string;
    locationId?: string;
  }): Promise<GeoJSONFeatureCollection> {
    const where: any = {
      parcel: { isNot: null },
    };

    if (filters.locationId) {
      where.locationId = filters.locationId;
    } else if (filters.district || filters.tehsil || filters.village) {
      where.location = {
        ...(filters.district && { district: { contains: filters.district } }),
        ...(filters.tehsil && { tehsil: { contains: filters.tehsil } }),
        ...(filters.village && { village: { contains: filters.village } }),
      };
    }

    const records = await prisma.landRecord.findMany({
      where,
      include: {
        owners: true,
        parcel: true,
        location: true,
      },
    });

    const features = records.map((rec) => {
      let geom: any = null;
      if (rec.parcel?.geometryJson) {
        geom = typeof rec.parcel.geometryJson === 'string'
          ? JSON.parse(rec.parcel.geometryJson)
          : rec.parcel.geometryJson;
      }

      return {
        type: 'Feature' as const,
        id: rec.id,
        geometry: geom,
        properties: {
          recordId: rec.id,
          ulpin: rec.ulpin,
          khasraNumber: rec.khasraNumber,
          khatauniNumber: rec.khatauniNumber,
          locationId: rec.locationId,
          state: rec.location?.state || 'Rajasthan',
          district: rec.location?.district || '',
          tehsil: rec.location?.tehsil || '',
          village: rec.location?.village || '',
          areaInSqMeters: rec.areaInSqMeters,
          status: rec.status,
          primaryOwner: rec.owners.find((o) => o.isPrimary)?.fullName || rec.owners[0]?.fullName || 'Unknown',
          centroidLat: rec.parcel?.centroidLat,
          centroidLng: rec.parcel?.centroidLng,
        },
      };
    });

    return {
      type: 'FeatureCollection',
      features,
    };
  }

  static async computeCentroidAndArea(geometryJson: any) {
    const centroid = turf.centroid(geometryJson);
    const areaSqM = turf.area(geometryJson);

    return {
      centroidLng: centroid.geometry.coordinates[0],
      centroidLat: centroid.geometry.coordinates[1],
      areaInSqMeters: Math.round(areaSqM * 100) / 100,
    };
  }
}
