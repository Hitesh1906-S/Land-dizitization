import { prisma } from '../../config/database';
import { NotFoundError } from '../../utils/AppError';
import { ValidationReportDTO, ValidationRuleResult, ConflictType, ConflictStatus } from '@land-digitization/shared';
import * as turf from '@turf/turf';

export class ValidationEngine {
  static async validateRecord(recordId: string): Promise<ValidationReportDTO> {
    const record = await prisma.landRecord.findUnique({
      where: { id: recordId },
      include: {
        owners: true,
        geometry: true,
      },
    });

    if (!record) {
      throw new NotFoundError(`Land record with ID ${recordId} not found`);
    }

    const ruleResults: ValidationRuleResult[] = [];

    // Rule 1: Syntactic check (Valid Khasra & Khatauni format)
    const hasValidKhasra = Boolean(record.khasraNumber && /^[0-9]+(\/[0-9]+)*[A-Za-z]?$/.test(record.khasraNumber));
    ruleResults.push({
      ruleId: 'RULE_SYNTAX_KHASRA',
      ruleName: 'Khasra Number Format Validation',
      passed: hasValidKhasra,
      severity: 'ERROR',
      message: hasValidKhasra
        ? 'Khasra number adheres to state land survey format standard.'
        : `Invalid Khasra format "${record.khasraNumber}". Expected format like "102", "102/1", "102/4A".`,
    });

    // Rule 2: Share Sum Arithmetic Check (sum of owner shares should equal 1.0 / 100%)
    const totalShare = record.owners.reduce((sum, owner) => sum + owner.shareFraction, 0);
    const sharePassed = Math.abs(totalShare - 1.0) < 0.001;
    ruleResults.push({
      ruleId: 'RULE_SHARE_SUM',
      ruleName: 'Ownership Share Sum Integrity (100%)',
      passed: sharePassed,
      severity: 'ERROR',
      message: sharePassed
        ? `Owner shares total 100.0% (${totalShare.toFixed(2)}).`
        : `Ownership share sum mismatch: total is ${(totalShare * 100).toFixed(1)}% instead of 100.0%.`,
      details: { totalShare, ownerCount: record.owners.length },
    });

    // Rule 3: Spatial Boundary and Area Consistency Check
    if (record.geometry) {
      try {
        const poly = typeof record.geometry.geometryJson === 'string'
          ? JSON.parse(record.geometry.geometryJson)
          : (record.geometry.geometryJson as any);
        const calculatedAreaSqM = turf.area(poly);
        const areaDifference = Math.abs(calculatedAreaSqM - record.areaInSqMeters);
        const tolerancePercentage = 0.05; // 5% tolerance
        const maxAllowedDiff = record.areaInSqMeters * tolerancePercentage;
        const areaPassed = areaDifference <= maxAllowedDiff;

        ruleResults.push({
          ruleId: 'RULE_AREA_CONSISTENCY',
          ruleName: 'GIS Polygon vs Registered Deed Area Consistency',
          passed: areaPassed,
          severity: 'WARNING',
          message: areaPassed
            ? `GIS polygon area (${Math.round(calculatedAreaSqM)} m²) matches registered deed area (${record.areaInSqMeters} m²) within 5% tolerance.`
            : `GIS area (${Math.round(calculatedAreaSqM)} m²) differs from deed area (${record.areaInSqMeters} m²) by ${Math.round(areaDifference)} m².`,
          details: { calculatedAreaSqM, deedArea: record.areaInSqMeters, difference: areaDifference },
        });

        // Rule 4: Spatial Overlap / Boundary Encroachment with other parcels
        const otherParcels = await prisma.landRecord.findMany({
          where: {
            id: { not: record.id },
            district: record.district,
            tehsil: record.tehsil,
            village: record.village,
            geometry: { isNot: null },
          },
          include: { geometry: true },
        });

        let overlapDetected = false;
        for (const other of otherParcels) {
          if (other.geometry) {
            const otherPoly = typeof other.geometry.geometryJson === 'string'
              ? JSON.parse(other.geometry.geometryJson)
              : (other.geometry.geometryJson as any);
            const intersection = turf.intersect(poly, otherPoly);

            if (intersection) {
              const overlapArea = turf.area(intersection);
              if (overlapArea > 5) {
                // > 5 sq meters is a meaningful overlap
                overlapDetected = true;
                const overlapPct = (overlapArea / record.areaInSqMeters) * 100;

                // Log or create duplicate conflict
                await prisma.duplicateConflict.upsert({
                  where: { id: `overlap-${record.id}-${other.id}` },
                  create: {
                    id: `overlap-${record.id}-${other.id}`,
                    recordAId: record.id,
                    recordBId: other.id,
                    conflictType: ConflictType.SPATIAL_OVERLAP,
                    overlapPercentage: overlapPct,
                    status: ConflictStatus.OPEN,
                  },
                  update: {
                    overlapPercentage: overlapPct,
                  },
                });

                ruleResults.push({
                  ruleId: 'RULE_SPATIAL_OVERLAP',
                  ruleName: `Spatial Boundary Overlap with Khasra ${other.khasraNumber}`,
                  passed: false,
                  severity: 'ERROR',
                  message: `Detected ${Math.round(overlapArea)} m² (${overlapPct.toFixed(1)}%) spatial overlap with parcel ${other.khasraNumber}.`,
                  details: { conflictingRecordId: other.id, overlapArea, overlapPct },
                });
              }
            }
          }
        }

        if (!overlapDetected) {
          ruleResults.push({
            ruleId: 'RULE_SPATIAL_OVERLAP',
            ruleName: 'Spatial Encroachment & Overlap Check',
            passed: true,
            severity: 'INFO',
            message: 'No boundary overlaps detected with neighboring parcels in village.',
          });
        }
      } catch (spatialErr: any) {
        ruleResults.push({
          ruleId: 'RULE_GIS_PARSE',
          ruleName: 'GeoJSON Topology Parsing',
          passed: false,
          severity: 'ERROR',
          message: `Failed to compute spatial topology: ${spatialErr.message}`,
        });
      }
    } else {
      ruleResults.push({
        ruleId: 'RULE_GIS_EXISTS',
        ruleName: 'Cadastral GIS Geometry Check',
        passed: false,
        severity: 'WARNING',
        message: 'No spatial parcel boundary GeoJSON linked to this record.',
      });
    }

    const passedCount = ruleResults.filter((r) => r.passed).length;
    const score = Math.round((passedCount / ruleResults.length) * 100);
    const isValid = ruleResults.every((r) => r.passed || r.severity !== 'ERROR');

    const report = await prisma.validationReport.create({
      data: {
        recordId: record.id,
        isValid,
        score,
        ruleResultsJson: JSON.stringify(ruleResults),
      },
    });

    return {
      id: report.id,
      recordId: report.recordId,
      isValid: report.isValid,
      score: report.score,
      ruleResults,
      createdAt: report.createdAt.toISOString(),
    };
  }
}
