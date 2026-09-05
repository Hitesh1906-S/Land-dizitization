import { prisma } from '../../config/database.js';
import { SimilarityUtil } from './similarity.util.js';
import { ConflictType, ConflictStatus, DuplicateScoreBreakdown } from '@land-digitization/shared';

export interface CandidateComparisonResult {
  primaryRecordId: string;
  conflictingRecordId: string;
  conflictType: ConflictType;
  compositeScore: number; // 0 - 100
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  scoreBreakdown: DuplicateScoreBreakdown;
  matchReasons: string[];
}

export class DuplicateDetectorService {
  /**
   * Weights for multi-vector duplicate similarity comparison
   */
  private static readonly WEIGHTS = {
    KHASRA: 0.35,
    LOCATION: 0.25,
    OWNER: 0.20,
    AREA: 0.10,
    REGISTRATION: 0.10,
  };

  /**
   * Compare two LandRecord objects and calculate detailed similarity breakdown
   */
  static compareRecords(recordA: any, recordB: any): CandidateComparisonResult {
    const khasraScore = SimilarityUtil.compareKhasra(recordA.khasraNumber, recordB.khasraNumber);
    const locationScore = SimilarityUtil.compareLocation(recordA.location, recordB.location);
    const ownerScore = SimilarityUtil.compareOwners(recordA.owners || [], recordB.owners || []);
    const areaScore = SimilarityUtil.compareArea(recordA.areaInSqMeters, recordB.areaInSqMeters);
    const registrationScore = SimilarityUtil.compareRegistrationInfo(
      { khatauniNumber: recordA.khatauniNumber, ulpin: recordA.ulpin },
      { khatauniNumber: recordB.khatauniNumber, ulpin: recordB.ulpin }
    );

    let rawComposite =
      khasraScore * this.WEIGHTS.KHASRA +
      locationScore * this.WEIGHTS.LOCATION +
      ownerScore * this.WEIGHTS.OWNER +
      areaScore * this.WEIGHTS.AREA +
      registrationScore * this.WEIGHTS.REGISTRATION;

    // Apply domain heuristics
    if (khasraScore === 100 && locationScore === 100) {
      // Exact Khasra in same village is a strong collision indicator
      rawComposite = Math.max(rawComposite, 80);
      if (ownerScore >= 75) {
        rawComposite = Math.max(rawComposite, 95);
      }
    } else if (khasraScore < 50 && ownerScore < 50) {
      // Distinct parcel number and distinct titleholder in same village is NOT a duplicate
      rawComposite = Math.min(rawComposite, 25);
    } else if (locationScore < 90) {
      // Different village means distinct cadastral jurisdiction
      rawComposite = Math.min(rawComposite, 35);
    }

    const compositeScore = Math.round(rawComposite);

    // Determine confidence level
    let confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
    if (compositeScore >= 80) confidenceLevel = 'HIGH';
    else if (compositeScore >= 60) confidenceLevel = 'MEDIUM';

    // Compile human-readable match reasons
    const matchReasons: string[] = [];
    if (khasraScore === 100) matchReasons.push(`Exact normalized Khasra match (${recordA.khasraNumber})`);
    else if (khasraScore >= 60) matchReasons.push(`Shared base parcel division (${recordA.khasraNumber} vs ${recordB.khasraNumber})`);

    if (locationScore === 100) matchReasons.push('Identical Village, Tehsil, and District');
    else if (locationScore >= 80) matchReasons.push('Same Tehsil jurisdiction');

    if (ownerScore === 100) matchReasons.push('Identical Titleholder Name');
    else if (ownerScore >= 75) matchReasons.push(`High phonetic/token owner similarity (${ownerScore}%)`);

    if (areaScore >= 90) matchReasons.push(`Area matches within 5% tolerance (${recordA.areaInSqMeters} m² vs ${recordB.areaInSqMeters} m²)`);

    if (registrationScore === 100) matchReasons.push('Matching Khatauni / Registry identifier');

    // Classify conflict type
    let conflictType = ConflictType.FUZZY_MATCH;
    if (khasraScore === 100 && locationScore === 100) {
      conflictType = ConflictType.DUPLICATE_KHASRA;
    } else if (compositeScore >= 80) {
      conflictType = ConflictType.FUZZY_DUPLICATE;
    } else if (locationScore >= 80 && ownerScore < 40 && khasraScore >= 60) {
      conflictType = ConflictType.TITLE_DISPUTE;
    }

    const scoreBreakdown: DuplicateScoreBreakdown = {
      khasraScore,
      ownerScore,
      locationScore,
      areaScore,
      registrationScore,
      compositeScore,
      confidenceLevel,
      matchReasons,
    };

    return {
      primaryRecordId: recordA.id,
      conflictingRecordId: recordB.id,
      conflictType,
      compositeScore,
      confidenceLevel,
      scoreBreakdown,
      matchReasons,
    };
  }

  /**
   * Scan a specific land record against active records in the database
   * STRICT GUARDRAIL: Never automatically merges records. Only flags candidates.
   */
  static async scanRecord(recordId: string, minConfidenceThreshold = 60): Promise<CandidateComparisonResult[]> {
    const targetRecord = await prisma.landRecord.findUnique({
      where: { id: recordId },
      include: {
        location: true,
        owners: true,
        parcel: true,
      },
    });

    if (!targetRecord) {
      return [];
    }

    // Query potential candidate records (filter within same district/state if available to optimize)
    const candidates = await prisma.landRecord.findMany({
      where: {
        id: { not: recordId },
        status: { not: 'ARCHIVED' },
      },
      include: {
        location: true,
        owners: true,
        parcel: true,
      },
      take: 200,
    });

    const results: CandidateComparisonResult[] = [];

    for (const candidate of candidates) {
      const comparison = this.compareRecords(targetRecord, candidate);
      if (comparison.compositeScore >= minConfidenceThreshold) {
        results.push(comparison);

        // Upsert into DuplicateCandidate table without auto-merging
        await this.persistCandidate(comparison);
      }
    }

    // Sort highest confidence first
    return results.sort((a, b) => b.compositeScore - a.compositeScore);
  }

  /**
   * Scan all active records across the repository or a specific location
   */
  static async scanAllRecords(locationId?: string, minConfidenceThreshold = 60): Promise<CandidateComparisonResult[]> {
    const records = await prisma.landRecord.findMany({
      where: {
        status: { not: 'ARCHIVED' },
        ...(locationId && { locationId }),
      },
      include: {
        location: true,
        owners: true,
        parcel: true,
      },
    });

    const detectedCandidates: CandidateComparisonResult[] = [];
    const evaluatedPairs = new Set<string>();

    for (let i = 0; i < records.length; i++) {
      for (let j = i + 1; j < records.length; j++) {
        const rA = records[i];
        const rB = records[j];

        const pairKey = [rA.id, rB.id].sort().join(':');
        if (evaluatedPairs.has(pairKey)) continue;
        evaluatedPairs.add(pairKey);

        const comparison = this.compareRecords(rA, rB);
        if (comparison.compositeScore >= minConfidenceThreshold) {
          detectedCandidates.push(comparison);
          await this.persistCandidate(comparison);
        }
      }
    }

    return detectedCandidates.sort((a, b) => b.compositeScore - a.compositeScore);
  }

  /**
   * Persist candidate record into database if not already present
   */
  private static async persistCandidate(comparison: CandidateComparisonResult): Promise<void> {
    try {
      const existing = await prisma.duplicateCandidate.findFirst({
        where: {
          OR: [
            {
              primaryRecordId: comparison.primaryRecordId,
              conflictingRecordId: comparison.conflictingRecordId,
            },
            {
              primaryRecordId: comparison.conflictingRecordId,
              conflictingRecordId: comparison.primaryRecordId,
            },
          ],
        },
      });

      if (!existing) {
        await prisma.duplicateCandidate.create({
          data: {
            primaryRecordId: comparison.primaryRecordId,
            conflictingRecordId: comparison.conflictingRecordId,
            conflictType: comparison.conflictType,
            overlapPercentage: comparison.compositeScore,
            status: ConflictStatus.OPEN,
            resolutionNotes: `Auto-detected duplicate candidate: ${comparison.matchReasons.join('; ')}`,
          },
        });
      } else if (existing.status === ConflictStatus.OPEN) {
        // Update overlap / confidence score if still open
        await prisma.duplicateCandidate.update({
          where: { id: existing.id },
          data: {
            overlapPercentage: comparison.compositeScore,
            conflictType: comparison.conflictType,
          },
        });
      }
    } catch (err) {
      console.error('Error persisting duplicate candidate:', err);
    }
  }
}
