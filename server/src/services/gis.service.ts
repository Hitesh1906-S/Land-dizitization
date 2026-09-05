import { prisma } from '../config/database.js';
import { GeoJSONFeatureCollection, RecordStatus } from '@land-digitization/shared';
import * as turf from '@turf/turf';

export interface ParcelFilterOptions {
  district?: string;
  tehsil?: string;
  village?: string;
  locationId?: string;
  status?: RecordStatus | string;
  validationStatus?: 'ALL' | 'PASSED' | 'WARNINGS' | 'FAILED' | 'UNVALIDATED';
  khasraNumber?: string;
  search?: string;
}

export class GisService {
  /**
   * Get Cadastral Parcels GeoJSON FeatureCollection with connected LandRecord metadata and validation states
   */
  static async getVillageParcelsGeoJSON(filters?: ParcelFilterOptions): Promise<GeoJSONFeatureCollection> {
    const where: any = {
      parcel: { isNot: null },
      status: { not: 'ARCHIVED' },
    };

    if (filters?.locationId) {
      where.locationId = filters.locationId;
    }

    if (filters?.status && filters.status !== 'ALL') {
      where.status = filters.status;
    }

    if (filters?.khasraNumber) {
      where.khasraNumber = { contains: filters.khasraNumber };
    }

    if (filters?.district || filters?.tehsil || filters?.village) {
      where.location = {
        ...(filters.district && { district: { contains: filters.district } }),
        ...(filters.tehsil && { tehsil: { contains: filters.tehsil } }),
        ...(filters.village && { village: { contains: filters.village } }),
      };
    }

    if (filters?.search) {
      const q = filters.search.trim();
      where.OR = [
        { khasraNumber: { contains: q } },
        { ulpin: { contains: q } },
        { khatauniNumber: { contains: q } },
        { owners: { some: { fullName: { contains: q } } } },
        { location: { village: { contains: q } } },
      ];
    }

    const records = await prisma.landRecord.findMany({
      where,
      include: {
        owners: true,
        parcel: true,
        location: true,
        validationResults: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { issues: true },
        },
        primaryConflicts: {
          where: { status: { in: ['OPEN', 'INVESTIGATING'] } },
        },
        conflictingDuplicates: {
          where: { status: { in: ['OPEN', 'INVESTIGATING'] } },
        },
      },
    });

    const features: any[] = [];

    for (const rec of records) {
      let geom: any = null;
      if (rec.parcel?.geometryJson) {
        geom =
          typeof rec.parcel.geometryJson === 'string'
            ? JSON.parse(rec.parcel.geometryJson)
            : rec.parcel.geometryJson;
      }

      if (!geom) continue;

      // Extract latest validation result
      const latestValidation = rec.validationResults[0] || null;
      let validationStatus: 'PASSED' | 'WARNINGS' | 'FAILED' | 'UNVALIDATED' = 'UNVALIDATED';
      let validationScore: number | null = null;
      let criticalIssuesCount = 0;
      let warningIssuesCount = 0;

      if (latestValidation) {
        validationScore = latestValidation.overallScore;
        const issues = latestValidation.issues || [];
        criticalIssuesCount = issues.filter((i: any) => i.severity === 'CRITICAL' && !i.isResolved).length;
        warningIssuesCount = issues.filter((i: any) => i.severity === 'WARNING' && !i.isResolved).length;

        if (latestValidation.isValid && criticalIssuesCount === 0 && warningIssuesCount === 0) {
          validationStatus = 'PASSED';
        } else if (criticalIssuesCount > 0 || !latestValidation.isValid) {
          validationStatus = 'FAILED';
        } else {
          validationStatus = 'WARNINGS';
        }
      }

      // Check if validationStatus filter matches
      if (filters?.validationStatus && filters.validationStatus !== 'ALL') {
        if (validationStatus !== filters.validationStatus) {
          continue;
        }
      }

      const hasConflict =
        (rec.primaryConflicts && rec.primaryConflicts.length > 0) ||
        (rec.conflictingDuplicates && rec.conflictingDuplicates.length > 0);

      // Compute bounding box
      let bbox: number[] = [];
      try {
        bbox = turf.bbox(geom);
      } catch {
        bbox = [];
      }

      features.push({
        type: 'Feature',
        id: rec.parcel?.id || rec.id,
        geometry: geom,
        bbox: bbox.length === 4 ? bbox : undefined,
        properties: {
          parcelId: rec.parcel?.id || rec.id,
          recordId: rec.id,
          ulpin: rec.ulpin,
          khasraNumber: rec.khasraNumber,
          khatauniNumber: rec.khatauniNumber,
          locationId: rec.locationId,
          location: rec.location
            ? {
                state: rec.location.state,
                district: rec.location.district,
                tehsil: rec.location.tehsil,
                village: rec.location.village,
                subDivision: rec.location.subDivision || undefined,
                pincode: rec.location.pincode || undefined,
              }
            : null,
          locationName: rec.location
            ? `${rec.location.village}, ${rec.location.tehsil}, ${rec.location.district}`
            : 'Unassigned Location',
          areaInSqMeters: rec.areaInSqMeters,
          areaUnit: rec.areaUnit,
          landType: rec.landType,
          status: rec.status,
          primaryOwner:
            rec.owners.find((o: any) => o.isPrimary)?.fullName ||
            rec.owners[0]?.fullName ||
            'Unassigned Titleholder',
          owners: rec.owners.map((o: any) => ({
            id: o.id,
            fullName: o.fullName,
            shareFraction: o.shareFraction,
            isPrimary: o.isPrimary,
            relationType: o.relationType,
            guardianName: o.guardianName,
          })),
          centroidLat: rec.parcel?.centroidLat || null,
          centroidLng: rec.parcel?.centroidLng || null,
          validationStatus,
          validationScore,
          criticalIssuesCount,
          warningIssuesCount,
          hasConflict,
          updatedAt: rec.updatedAt.toISOString(),
        },
      });
    }

    return {
      type: 'FeatureCollection',
      features,
    };
  }

  /**
   * Get single parcel with rich details
   */
  static async getParcelById(parcelId: string) {
    const parcel = await prisma.parcel.findUnique({
      where: { id: parcelId },
      include: {
        landRecord: {
          include: {
            owners: true,
            location: true,
            validationResults: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: { issues: true },
            },
          },
        },
      },
    });

    if (!parcel) {
      return null;
    }

    return parcel;
  }

  /**
   * Compute Centroid and Area with Turf.js
   */
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
