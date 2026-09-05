import { prisma } from '../config/database';
import { GeoJSONFeatureCollection } from '@land-digitization/shared';
import * as turf from '@turf/turf';

export class GisService {
  static async getVillageParcelsGeoJSON(filters: {
    district?: string;
    tehsil?: string;
    village?: string;
  }): Promise<GeoJSONFeatureCollection> {
    const where: any = {
      geometry: { isNot: null },
    };

    if (filters.district) where.district = { contains: filters.district, mode: 'insensitive' };
    if (filters.tehsil) where.tehsil = { contains: filters.tehsil, mode: 'insensitive' };
    if (filters.village) where.village = { contains: filters.village, mode: 'insensitive' };

    const records = await prisma.landRecord.findMany({
      where,
      include: {
        owners: true,
        geometry: true,
      },
    });

    const features = records.map((rec) => {
      let geom: any = null;
      if (rec.geometry?.geometryJson) {
        geom = typeof rec.geometry.geometryJson === 'string'
          ? JSON.parse(rec.geometry.geometryJson)
          : rec.geometry.geometryJson;
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
          district: rec.district,
          tehsil: rec.tehsil,
          village: rec.village,
          areaInSqMeters: rec.areaInSqMeters,
          status: rec.status,
          primaryOwner: rec.owners.find((o) => o.isPrimary)?.ownerName || rec.owners[0]?.ownerName || 'Unknown',
          centroidLat: rec.geometry?.centroidLat,
          centroidLng: rec.geometry?.centroidLng,
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
