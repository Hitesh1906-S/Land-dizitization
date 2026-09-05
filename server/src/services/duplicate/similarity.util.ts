/**
 * Normalization & Similarity Matching Utilities for Land Records
 */

export class SimilarityUtil {
  /**
   * Normalize Khasra / Survey Number:
   * Strips prefixes ("Plot", "Khasra", "No", "#"),
   * Standardizes delimiters (-, _, \, space) to "/",
   * Removes leading zeros in components (e.g. "142/04" -> "142/4", "007" -> "7").
   */
  static normalizeKhasra(khasra: string | null | undefined): string {
    if (!khasra) return '';
    let clean = khasra
      .trim()
      .toLowerCase()
      .replace(/^(plot|khasra|survey|no\.?|#)\s*/gi, '')
      .replace(/[\s\-_\\,]+/g, '/');

    // Split components and strip leading zeros from numeric parts
    const parts = clean.split('/').filter(Boolean);
    const normalizedParts = parts.map((p) => {
      const trimmed = p.trim();
      if (/^\d+$/.test(trimmed)) {
        return parseInt(trimmed, 10).toString();
      }
      // If alphanumeric like "04a" -> "4a"
      const match = trimmed.match(/^0+(\d+[a-z]*)$/i);
      return match ? match[1] : trimmed;
    });

    return normalizedParts.join('/');
  }

  /**
   * Compare two Khasra numbers and return a score between 0 and 100.
   */
  static compareKhasra(khasra1: string | null | undefined, khasra2: string | null | undefined): number {
    const norm1 = this.normalizeKhasra(khasra1);
    const norm2 = this.normalizeKhasra(khasra2);

    if (!norm1 || !norm2) return 0;
    if (norm1 === norm2) return 100;

    // Check base plot matching (e.g. 142/1 vs 142/2)
    const base1 = norm1.split('/')[0];
    const base2 = norm2.split('/')[0];

    if (base1 === base2 && base1.length > 0) {
      // Same base parcel, sub-division variation
      return 60;
    }

    // Levenshtein similarity fallback
    const lev = this.levenshteinSimilarity(norm1, norm2);
    return Math.round(lev * 40);
  }

  /**
   * Normalize owner name:
   * Strips common Indian land registry honorifics / titles,
   * Removes punctuation, collapses multiple whitespace, converts to lowercase.
   */
  static normalizeOwnerName(name: string | null | undefined): string {
    if (!name) return '';
    return name
      .toLowerCase()
      .replace(/\b(shri|shree|smt|shrimati|late|dr|mr|mrs|ms|ji|advocate|thakur|chaudhary|ch|pandit|pt)\b\.?/gi, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Jaro-Winkler string similarity (0.0 to 1.0)
   */
  static jaroWinkler(s1: string, s2: string): number {
    const a = s1.trim().toLowerCase();
    const b = s2.trim().toLowerCase();

    if (a === b) return 1.0;
    if (a.length === 0 || b.length === 0) return 0.0;

    const matchDistance = Math.floor(Math.max(a.length, b.length) / 2) - 1;
    const aMatches = new Array(a.length).fill(false);
    const bMatches = new Array(b.length).fill(false);

    let matches = 0;
    let transpositions = 0;

    for (let i = 0; i < a.length; i++) {
      const start = Math.max(0, i - matchDistance);
      const end = Math.min(i + matchDistance + 1, b.length);

      for (let j = start; j < end; j++) {
        if (bMatches[j]) continue;
        if (a[i] !== b[j]) continue;
        aMatches[i] = true;
        bMatches[j] = true;
        matches++;
        break;
      }
    }

    if (matches === 0) return 0.0;

    let k = 0;
    for (let i = 0; i < a.length; i++) {
      if (!aMatches[i]) continue;
      while (!bMatches[k]) k++;
      if (a[i] !== b[k]) transpositions++;
      k++;
    }

    const similarity =
      (matches / a.length + matches / b.length + (matches - transpositions / 2) / matches) / 3;

    // Winkler prefix bonus (up to 4 chars)
    let prefix = 0;
    for (let i = 0; i < Math.min(4, Math.min(a.length, b.length)); i++) {
      if (a[i] === b[i]) prefix++;
      else break;
    }

    return similarity + prefix * 0.1 * (1 - similarity);
  }

  /**
   * Token Set Similarity (handles reordered names e.g. "Kumar Ramesh" vs "Ramesh Kumar")
   */
  static tokenSetSimilarity(s1: string, s2: string): number {
    const tokens1 = new Set(s1.split(' ').filter(Boolean));
    const tokens2 = new Set(s2.split(' ').filter(Boolean));

    if (tokens1.size === 0 || tokens2.size === 0) return 0;

    let intersection = 0;
    tokens1.forEach((t) => {
      if (tokens2.has(t)) intersection++;
    });

    const union = new Set([...tokens1, ...tokens2]).size;
    return union > 0 ? intersection / union : 0;
  }

  /**
   * Compare two lists of owners or names and return highest match score (0 - 100).
   */
  static compareOwners(
    owners1: Array<{ fullName: string; guardianName?: string | null }> | string[],
    owners2: Array<{ fullName: string; guardianName?: string | null }> | string[]
  ): number {
    if (!owners1 || !owners2 || owners1.length === 0 || owners2.length === 0) {
      return 0;
    }

    const names1 = owners1.map((o) => (typeof o === 'string' ? o : o.fullName));
    const names2 = owners2.map((o) => (typeof o === 'string' ? o : o.fullName));

    let maxScore = 0;

    for (const n1 of names1) {
      const norm1 = this.normalizeOwnerName(n1);
      for (const n2 of names2) {
        const norm2 = this.normalizeOwnerName(n2);
        if (norm1 === norm2 && norm1.length > 0) {
          return 100;
        }

        const jw = this.jaroWinkler(norm1, norm2);
        const tokenSim = this.tokenSetSimilarity(norm1, norm2);

        let combined = 0;
        if (tokenSim >= 0.75 || jw >= 0.85) {
          combined = Math.max(jw, tokenSim);
        } else if (jw >= 0.65 || tokenSim >= 0.4) {
          combined = jw * 0.6 + tokenSim * 0.4;
        } else {
          combined = 0;
        }

        const score = Math.round(combined * 100);

        if (score > maxScore) {
          maxScore = score;
        }
      }
    }

    return maxScore;
  }

  /**
   * Compare location hierarchy (State -> District -> Tehsil -> Village)
   */
  static compareLocation(
    loc1: { state?: string; district?: string; tehsil?: string; village?: string } | null | undefined,
    loc2: { state?: string; district?: string; tehsil?: string; village?: string } | null | undefined
  ): number {
    if (!loc1 || !loc2) return 50; // Unknown / neutral

    const norm = (s?: string) => (s || '').trim().toLowerCase();

    const sameState = norm(loc1.state) === norm(loc2.state);
    const sameDistrict = norm(loc1.district) === norm(loc2.district);
    const sameTehsil = norm(loc1.tehsil) === norm(loc2.tehsil);
    const sameVillage = norm(loc1.village) === norm(loc2.village);

    if (sameVillage && sameTehsil && sameDistrict) return 100;
    if (sameVillage && sameDistrict) return 90;
    if (sameTehsil && sameDistrict) return 40;
    if (sameDistrict) return 20;
    if (sameState) return 10;
    return 0;
  }

  /**
   * Compare land record area in sq. meters with mathematical tolerance curves.
   */
  static compareArea(area1: number | null | undefined, area2: number | null | undefined): number {
    if (area1 == null || area2 == null || area1 <= 0 || area2 <= 0) {
      return 50; // Neutral if missing
    }

    const max = Math.max(area1, area2);
    const diff = Math.abs(area1 - area2);
    const pctDiff = diff / max;

    if (pctDiff <= 0.01) return 100; // Within 1%
    if (pctDiff <= 0.05) return 90;  // Within 5%
    if (pctDiff <= 0.10) return 75;  // Within 10%
    if (pctDiff <= 0.20) return 55;  // Within 20%
    if (pctDiff <= 0.35) return 30;  // Within 35%
    return 10;
  }

  /**
   * Compare registration details (Khatauni number, ULPIN prefix, Deed ref).
   */
  static compareRegistrationInfo(
    rec1: { khatauniNumber?: string | null; ulpin?: string | null },
    rec2: { khatauniNumber?: string | null; ulpin?: string | null }
  ): number {
    const k1 = (rec1.khatauniNumber || '').trim().toLowerCase();
    const k2 = (rec2.khatauniNumber || '').trim().toLowerCase();

    if (k1 && k2 && k1 === k2) {
      return 100;
    }

    const u1 = (rec1.ulpin || '').trim().toLowerCase();
    const u2 = (rec2.ulpin || '').trim().toLowerCase();

    if (u1 && u2 && u1 === u2) {
      return 100;
    }

    if (k1 && k2) {
      const lev = this.levenshteinSimilarity(k1, k2);
      return Math.round(lev * 80);
    }

    return 50; // Neutral if not populated
  }

  /**
   * Standard Levenshtein normalized similarity (0.0 to 1.0)
   */
  static levenshteinSimilarity(s1: string, s2: string): number {
    if (s1 === s2) return 1.0;
    if (s1.length === 0) return 0.0;
    if (s2.length === 0) return 0.0;

    const track = Array(s2.length + 1)
      .fill(null)
      .map(() => Array(s1.length + 1).fill(null));

    for (let i = 0; i <= s1.length; i += 1) {
      track[0][i] = i;
    }
    for (let j = 0; j <= s2.length; j += 1) {
      track[j][0] = j;
    }

    for (let j = 1; j <= s2.length; j += 1) {
      for (let i = 1; i <= s1.length; i += 1) {
        const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
        track[j][i] = Math.min(
          track[j][i - 1] + 1, // deletion
          track[j - 1][i] + 1, // insertion
          track[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    const distance = track[s2.length][s1.length];
    const maxLen = Math.max(s1.length, s2.length);
    return 1 - distance / maxLen;
  }
}
