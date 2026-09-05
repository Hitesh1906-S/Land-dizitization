import { IValidationRule, ValidationCheckResult, ValidationContext } from './rule.interface.js';
import * as turf from '@turf/turf';

export class AreaMismatchRule implements IValidationRule {
  readonly ruleCode = 'AREA_MISMATCH';
  readonly name = 'Land Area Mathematical & Spatial Consistency Check';
  readonly category = 'AREA_CHECK' as const;
  readonly defaultSeverity = 'WARNING' as const;
  readonly description = 'Compares registered deed area against computed Turf.js GIS polygon area and OCR-extracted document values.';

  async validate(context: ValidationContext): Promise<ValidationCheckResult> {
    const { record } = context;

    if (!record.areaInSqMeters || record.areaInSqMeters <= 0) {
      return {
        ruleCode: this.ruleCode,
        name: this.name,
        category: this.category,
        passed: false,
        severity: 'CRITICAL',
        title: 'Missing or Non-Positive Land Area',
        explanation: `Registered land area is ${record.areaInSqMeters} m² (must be strictly greater than 0).`,
        conflictingValues: { expected: '> 0 m²', actual: `${record.areaInSqMeters} m²` },
        recommendedAction: 'Input valid measured area in square meters.',
      };
    }

    // 1. Spatial GIS Polygon Area Check
    if (record.parcel && record.parcel.geometryJson) {
      try {
        const poly =
          typeof record.parcel.geometryJson === 'string'
            ? JSON.parse(record.parcel.geometryJson)
            : record.parcel.geometryJson;

        const calculatedAreaSqM = turf.area(poly);
        const areaDifference = Math.abs(calculatedAreaSqM - record.areaInSqMeters);
        const deviationRatio = areaDifference / record.areaInSqMeters;

        if (deviationRatio > 0.05) {
          const isCritical = deviationRatio > 0.2;
          const severity = isCritical ? ('CRITICAL' as const) : ('WARNING' as const);

          return {
            ruleCode: this.ruleCode,
            name: this.name,
            category: this.category,
            passed: false,
            severity,
            title: `GIS Boundary vs Registered Area Deviation (${(deviationRatio * 100).toFixed(1)}%)`,
            explanation: `GIS polygon computed area (${Math.round(calculatedAreaSqM)} m²) differs from registered deed area (${record.areaInSqMeters} m²) by ${Math.round(areaDifference)} m² (exceeds ${isCritical ? '20% critical threshold' : '5% statutory tolerance'}).`,
            conflictingValues: {
              registered: `${record.areaInSqMeters} m²`,
              actual: `${Math.round(calculatedAreaSqM)} m² (Computed from GIS polygon)`,
              additionalInfo: { deviationPercentage: (deviationRatio * 100).toFixed(1) },
            },
            recommendedAction: 'Dispatch field surveyor for GPS total-station boundary resurvey to reconcile cadastral bounds.',
          };
        }
      } catch (e: any) {
        return {
          ruleCode: this.ruleCode,
          name: this.name,
          category: this.category,
          passed: false,
          severity: 'WARNING',
          title: 'GIS Polygon Computation Failure',
          explanation: `Unable to compute polygon geometry area: ${e.message}`,
          recommendedAction: 'Verify and fix GeoJSON coordinate geometry for this parcel.',
        };
      }
    }

    // 2. OCR Extracted Area Cross-Reference
    if (record.documents && record.documents.length > 0) {
      for (const doc of record.documents) {
        if (doc.ocrResult?.extractedFields) {
          const ocrAreaField = doc.ocrResult.extractedFields.find((f) => f.fieldName === 'area');
          if (ocrAreaField && ocrAreaField.fieldValue) {
            const numericMatch = ocrAreaField.fieldValue.match(/[0-9]+(?:\.[0-9]+)?/);
            if (numericMatch) {
              const ocrVal = parseFloat(numericMatch[0]);
              // If OCR value is in hectares e.g. 0.85 -> 8500 sq meters
              let normalizedOcrSqM = ocrVal;
              if (ocrAreaField.fieldValue.toLowerCase().includes('hectare') || ocrAreaField.fieldValue.toLowerCase().includes('हेक्टेयर')) {
                normalizedOcrSqM = ocrVal * 10000;
              }

              const diff = Math.abs(normalizedOcrSqM - record.areaInSqMeters);
              if (diff > record.areaInSqMeters * 0.1) {
                return {
                  ruleCode: this.ruleCode,
                  name: this.name,
                  category: this.category,
                  passed: false,
                  severity: 'WARNING',
                  title: 'Registered Area vs Scanned Deed Text Inconsistency',
                  explanation: `Registered record area (${record.areaInSqMeters} m²) deviates from scanned deed extracted area "${ocrAreaField.fieldValue}".`,
                  conflictingValues: {
                    registered: `${record.areaInSqMeters} m²`,
                    ocrExtracted: ocrAreaField.fieldValue,
                  },
                  recommendedAction: 'Verify unit conversions (e.g. Bigha/Hectares to Sq. Meters) in physical revenue ledger.',
                };
              }
            }
          }
        }
      }
    }

    return {
      ruleCode: this.ruleCode,
      name: this.name,
      category: this.category,
      passed: true,
      severity: 'INFO',
      title: 'Area Metrics Verified',
      explanation: `Registered area (${record.areaInSqMeters} m²) is consistent with cadastral GIS geometry and deed documentation.`,
      recommendedAction: 'No action required.',
    };
  }
}
