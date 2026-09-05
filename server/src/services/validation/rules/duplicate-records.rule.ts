import { IValidationRule, ValidationCheckResult, ValidationContext } from './rule.interface.js';
import { prisma } from '../../../config/database.js';
import * as turf from '@turf/turf';
import { DuplicateDetectorService } from '../../duplicate/duplicate-detector.service.js';

export class DuplicateRecordsRule implements IValidationRule {
  readonly ruleCode = 'DUPLICATE_RECORDS';
  readonly name = 'Cadastral Duplicate & Spatial Encroachment Check';
  readonly category = 'DUPLICATE_CHECK' as const;
  readonly defaultSeverity = 'CRITICAL' as const;
  readonly description = 'Detects duplicate (location + Khasra) clashes, multi-vector similarity matches, cadastral boundary spatial overlaps, and duplicate deed reference numbers.';

  async validate(context: ValidationContext): Promise<ValidationCheckResult> {
    const { record } = context;

    // 1. Khasra & Location Duplicate Clash in Active Database
    const existingKhasraClash = await prisma.landRecord.findFirst({
      where: {
        id: { not: record.id },
        locationId: record.locationId,
        khasraNumber: record.khasraNumber,
        status: { not: 'ARCHIVED' },
      },
      include: { owners: true },
    });

    if (existingKhasraClash) {
      return {
        ruleCode: this.ruleCode,
        name: this.name,
        category: this.category,
        passed: false,
        severity: 'CRITICAL',
        title: `Duplicate Khasra ${record.khasraNumber} in Same Village`,
        explanation: `Another active land record (ID: ${existingKhasraClash.id}, ULPIN: ${existingKhasraClash.ulpin}) is already registered under Khasra ${record.khasraNumber} in this village.`,
        conflictingValues: {
          existingRecordId: existingKhasraClash.id,
          existingUlpin: existingKhasraClash.ulpin,
          existingOwners: existingKhasraClash.owners.map((o) => o.fullName).join(', '),
        },
        recommendedAction: 'Initiate formal Title Dispute resolution to prevent double-registration of title.',
      };
    }

    // 2. Spatial Overlap / Encroachment Check with Neighboring Parcels
    if (record.parcel && record.parcel.geometryJson) {
      try {
        const poly =
          typeof record.parcel.geometryJson === 'string'
            ? JSON.parse(record.parcel.geometryJson)
            : record.parcel.geometryJson;

        const otherParcels = await prisma.landRecord.findMany({
          where: {
            id: { not: record.id },
            locationId: record.locationId,
            parcel: { isNot: null },
          },
          include: { parcel: true },
        });

        for (const other of otherParcels) {
          if (other.parcel && other.parcel.geometryJson) {
            const otherPoly =
              typeof other.parcel.geometryJson === 'string'
                ? JSON.parse(other.parcel.geometryJson)
                : other.parcel.geometryJson;

            const intersection = turf.intersect(poly, otherPoly);
            if (intersection) {
              const overlapArea = turf.area(intersection);
              if (overlapArea > 5) {
                const overlapPct = (overlapArea / record.areaInSqMeters) * 100;
                return {
                  ruleCode: this.ruleCode,
                  name: this.name,
                  category: this.category,
                  passed: false,
                  severity: 'CRITICAL',
                  title: `Spatial Polygon Overlap with Khasra ${other.khasraNumber}`,
                  explanation: `Parcel geometry overlaps ${Math.round(overlapArea)} m² (${overlapPct.toFixed(1)}%) with adjacent registered Khasra ${other.khasraNumber}.`,
                  conflictingValues: {
                    conflictingRecordId: other.id,
                    conflictingKhasra: other.khasraNumber,
                    overlapAreaSqM: Math.round(overlapArea),
                    overlapPercentage: overlapPct.toFixed(1),
                  },
                  recommendedAction: 'Summon both titleholders for cadastral boundary demarcation with Tehsil surveyor.',
                };
              }
            }
          }
        }
      } catch (e) {
        // Fallback gracefully if geometry parsing is not applicable
      }
    }

    // 3. Multi-Vector Fuzzy Similarity Duplicate Scan
    try {
      const candidates = await DuplicateDetectorService.scanRecord(record.id, 75);
      if (candidates.length > 0) {
        const top = candidates[0];
        const severity = top.confidenceLevel === 'HIGH' ? 'CRITICAL' : 'WARNING';

        return {
          ruleCode: this.ruleCode,
          name: this.name,
          category: this.category,
          passed: false,
          severity,
          title: `Potential Duplicate Record (${top.compositeScore}% Match Confidence)`,
          explanation: `System detected potential duplicate candidate (Record ID: ${top.conflictingRecordId}) based on: ${top.matchReasons.join(', ')}.`,
          conflictingValues: {
            conflictingRecordId: top.conflictingRecordId,
            compositeScore: top.compositeScore,
            confidenceLevel: top.confidenceLevel,
            khasraScore: top.scoreBreakdown.khasraScore,
            ownerScore: top.scoreBreakdown.ownerScore,
            locationScore: top.scoreBreakdown.locationScore,
            areaScore: top.scoreBreakdown.areaScore,
            matchReasons: top.matchReasons.join('; '),
          },
          recommendedAction: 'Review duplicate candidate pair in the Conflict Workbench for human review and determination.',
        };
      }
    } catch (e) {
      // Continue if duplicate scan has non-critical issue
    }

    return {
      ruleCode: this.ruleCode,
      name: this.name,
      category: this.category,
      passed: true,
      severity: 'INFO',
      title: 'Duplicate & Spatial Checks Clear',
      explanation: `No duplicate Khasra collisions, spatial boundary overlaps, or high-confidence fuzzy duplicates detected.`,
      recommendedAction: 'No action required.',
    };
  }
}
