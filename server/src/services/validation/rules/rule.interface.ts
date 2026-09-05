export type RuleSeverity = 'CRITICAL' | 'WARNING' | 'INFO';

export type RuleCategory =
  | 'MANDATORY_FIELDS'
  | 'OWNER_CHECK'
  | 'KHASRA_CHECK'
  | 'AREA_CHECK'
  | 'LOCATION_CHECK'
  | 'DATE_CHECK'
  | 'DUPLICATE_CHECK'
  | 'REGISTRATION_CHECK';

export interface ConflictingValues {
  expected?: string | number | null;
  actual?: string | number | null;
  detectedInOcr?: string | number | null;
  registered?: string | number | null;
  ocrExtracted?: string | number | null;
  [key: string]: any;
}

export interface ValidationCheckResult {
  ruleCode: string;
  name: string;
  category: RuleCategory;
  passed: boolean;
  severity: RuleSeverity;
  title: string;
  explanation: string;
  conflictingValues?: ConflictingValues;
  recommendedAction: string;
}

export interface ValidationContext {
  record: {
    id: string;
    ulpin: string;
    khasraNumber: string;
    khatauniNumber: string;
    locationId: string;
    areaInSqMeters: number;
    areaUnit: string;
    landType: string;
    status: string;
    createdById: string;
    createdAt: Date;
    updatedAt: Date;
    location?: {
      id: string;
      state: string;
      district: string;
      tehsil: string;
      village: string;
    } | null;
    owners: Array<{
      id: string;
      fullName: string;
      relationType?: string | null;
      guardianName?: string | null;
      identifierMasked?: string | null;
      shareFraction: number;
      isPrimary: boolean;
    }>;
    parcel?: {
      id: string;
      geometryJson: string | any;
      centroidLat: number;
      centroidLng: number;
    } | null;
    documents?: Array<{
      id: string;
      fileName: string;
      fileType: string;
      documentType: string;
      createdAt: Date;
      ocrResult?: {
        id: string;
        status: string;
        rawText?: string | null;
        confidenceScore?: number | null;
        extractedFields?: Array<{
          id: string;
          fieldName: string;
          fieldValue: string;
          confidence: number;
          boundingBoxJson?: string | null;
          isVerified: boolean;
          verifiedValue?: string | null;
        }>;
      } | null;
    }>;
    ownershipHistory?: Array<{
      id: string;
      mutationDate: Date;
      mutationType: string;
      orderNumber?: string | null;
      remarks?: string | null;
    }>;
  };
}

export interface IValidationRule {
  readonly ruleCode: string;
  readonly name: string;
  readonly category: RuleCategory;
  readonly defaultSeverity: RuleSeverity;
  readonly description: string;
  validate(context: ValidationContext): Promise<ValidationCheckResult>;
}
