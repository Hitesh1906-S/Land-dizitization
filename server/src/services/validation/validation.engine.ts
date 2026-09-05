import { prisma } from '../../config/database';
import { NotFoundError } from '../../utils/AppError';
import { ValidationResultDTO, ValidationIssueDTO, ConflictType, ConflictStatus } from '@land-digitization/shared';
import * as turf from '@turf/turf';

export class ValidationEngine {
  static async validateRecord(recordId: string, executedById?: string): Promise<ValidationResultDTO> {
    const record = await prisma.landRecord.findUnique({
      where: { id: recordId },
      include: {
        owners: true,
        parcel: true,
        location: true,
      },
    });

    if (!record) {
      throw new NotFoundError(`Land record with ID ${recordId} not found`);
    }

    // Default executor fallback to record creator if not provided
    const validExecutorId = executedById || record.createdById;

    const issues: {
      ruleCode: string;
      severity: 'CRITICAL' | 'WARNING' | 'INFO';
      title: string;
      description: string;
      detailsJson?: string;
    }[] = [];

    // Rule 1: Syntactic check (Valid Khasra & Khatauni format)
    const hasValidKhasra = Boolean(record.khasraNumber && /^[0-9]+(\/[0-9]+)*[A-Za-z]?$/.test(record.khasraNumber));
    if (!hasValidKhasra) {
      issues.push({
        ruleCode: 'SYNTAX_INVALID',
        severity: 'CRITICAL',
        title: 'Invalid Khasra Number Syntax',
        description: `Khasra number "${record.khasraNumber}" does not follow state cadastral numbering format (e.g. 102/4).`,
      });
    }

    // Rule 2: Share Sum Arithmetic Check (sum of owner shares should equal 1.0 / 100%)
    const totalShare = record.owners.reduce((sum, owner) => sum + owner.shareFraction, 0);
    const sharePassed = Math.abs(totalShare - 1.0) < 0.001;
    if (!sharePassed) {
      issues.push({
        ruleCode: 'SHARE_SUM_MISMATCH',
        severity: 'CRITICAL',
        title: 'Ownership Share Sum Mismatch',
        description: `Total ownership shares equal ${(totalShare * 100).toFixed(1)}% instead of exactly 100.0%.`,
        detailsJson: JSON.stringify({ totalShare, ownerCount: record.owners.length }),
      });
    }

    // Rule 3: Spatial Boundary and Area Consistency Check
    if (record.parcel) {
      try {
        const poly = typeof record.parcel.geometryJson === 'string'
          ? JSON.parse(record.parcel.geometryJson)
          : (record.parcel.geometryJson as any);
        const calculatedAreaSqM = turf.area(poly);
        const areaDifference = Math.abs(calculatedAreaSqM - record.areaInSqMeters);
        const tolerancePercentage = 0.05; // 5% tolerance
        const maxAllowedDiff = record.areaInSqMeters * tolerancePercentage;

        if (areaDifference > maxAllowedDiff) {
          issues.push({
            ruleCode: 'AREA_DEVIATION',
            severity: 'WARNING',
            title: 'GIS Polygon vs Deed Area Deviation',
            description: `GIS calculated area (${Math.round(calculatedAreaSqM)} m²) differs from registered deed area (${record.areaInSqMeters} m²) by ${Math.round(areaDifference)} m² (>5% tolerance).`,
            detailsJson: JSON.stringify({ calculatedAreaSqM, deedArea: record.areaInSqMeters, difference: areaDifference }),
          });
        }

        // Rule 4: Spatial Overlap / Boundary Encroachment with other parcels in the same location
        const otherRecords = await prisma.landRecord.findMany({
          where: {
            id: { not: record.id },
            locationId: record.locationId,
            parcel: { isNot: null },
          },
          include: { parcel: true },
        });

        for (const other of otherRecords) {
          if (other.parcel) {
            const otherPoly = typeof other.parcel.geometryJson === 'string'
              ? JSON.parse(other.parcel.geometryJson)
              : (other.parcel.geometryJson as any);
            const intersection = turf.intersect(poly, otherPoly);

            if (intersection) {
              const overlapArea = turf.area(intersection);
              if (overlapArea > 5) {
                const overlapPct = (overlapArea / record.areaInSqMeters) * 100;

                issues.push({
                  ruleCode: 'SPATIAL_OVERLAP',
                  severity: 'CRITICAL',
                  title: `Spatial Boundary Overlap with Khasra ${other.khasraNumber}`,
                  description: `Detected ${Math.round(overlapArea)} m² (${overlapPct.toFixed(1)}%) spatial boundary overlap with adjacent parcel ${other.khasraNumber}.`,
                  detailsJson: JSON.stringify({ conflictingRecordId: other.id, overlapArea, overlapPct }),
                });

                // Create or update duplicate candidate
                const existingCandidate = await prisma.duplicateCandidate.findFirst({
                  where: {
                    primaryRecordId: record.id,
                    conflictingRecordId: other.id,
                  },
                });

                if (existingCandidate) {
                  await prisma.duplicateCandidate.update({
                    where: { id: existingCandidate.id },
                    data: {
                      overlapPercentage: overlapPct,
                      overlapAreaSqM: overlapArea,
                      conflictType: ConflictType.SPATIAL_OVERLAP,
                    },
                  });
                } else {
                  await prisma.duplicateCandidate.create({
                    data: {
                      primaryRecordId: record.id,
                      conflictingRecordId: other.id,
                      conflictType: ConflictType.SPATIAL_OVERLAP,
                      overlapPercentage: overlapPct,
                      overlapAreaSqM: overlapArea,
                      status: ConflictStatus.OPEN,
                    },
                  });
                }
              }
            }
          }
        }
      } catch (spatialErr: any) {
        issues.push({
          ruleCode: 'GIS_PARSE_ERROR',
          severity: 'CRITICAL',
          title: 'GIS Polygon Parse Failure',
          description: `Unable to compute spatial geometry: ${spatialErr.message}`,
        });
      }
    } else {
      issues.push({
        ruleCode: 'MISSING_PARCEL_GIS',
        severity: 'WARNING',
        title: 'Missing Cadastral GIS Polygon',
        description: 'Land record does not have an attached GIS parcel boundary geometry.',
      });
    }

    const criticalCount = issues.filter(i => i.severity === 'CRITICAL').length;
    const warningCount = issues.filter(i => i.severity === 'WARNING').length;
    const overallScore = Math.max(0, 100 - (criticalCount * 30) - (warningCount * 10));
    const isValid = criticalCount === 0;

    const summary = isValid
      ? `Validation passed successfully (Score: ${overallScore}%).`
      : `Validation found ${criticalCount} critical issue(s) and ${warningCount} warning(s).`;

    // Persist ValidationResult and granular ValidationIssue records
    const validationResult = await prisma.validationResult.create({
      data: {
        landRecordId: record.id,
        isValid,
        overallScore,
        summary,
        executedById: validExecutorId,
        issues: {
          create: issues.map(i => ({
            ruleCode: i.ruleCode,
            severity: i.severity,
            title: i.title,
            description: i.description,
            detailsJson: i.detailsJson,
          })),
        },
      },
      include: {
        issues: true,
      },
    });

    return this.mapToDTO(validationResult);
  }

  static async getValidationHistory(recordId: string): Promise<ValidationResultDTO[]> {
    const results = await prisma.validationResult.findMany({
      where: { landRecordId: recordId },
      include: { issues: true },
      orderBy: { createdAt: 'desc' },
    });

    return results.map(r => this.mapToDTO(r));
  }

  static mapToDTO(r: any): ValidationResultDTO {
    return {
      id: r.id,
      landRecordId: r.landRecordId,
      isValid: r.isValid,
      overallScore: r.overallScore,
      summary: r.summary || undefined,
      executedById: r.executedById,
      createdAt: r.createdAt.toISOString(),
      issues: r.issues ? r.issues.map((i: any): ValidationIssueDTO => ({
        id: i.id,
        validationResultId: i.validationResultId,
        ruleCode: i.ruleCode,
        severity: i.severity,
        title: i.title,
        description: i.description,
        detailsJson: i.detailsJson || undefined,
        isResolved: i.isResolved,
        resolvedById: i.resolvedById || undefined,
        resolvedAt: i.resolvedAt ? i.resolvedAt.toISOString() : undefined,
      })) : [],
    };
  }
}
