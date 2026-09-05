import { z } from 'zod';
import { UserRole, RecordStatus, LandType, AreaUnit, DocumentType, OcrEngine, ConflictType, ConflictStatus, RequestType, RequestStage, AuditAction } from '@land-digitization/shared';

// Auth Schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  fullName: z.string().min(2, 'Full legal name is required'),
  phone: z.string().optional(),
  role: z.nativeEnum(UserRole).default(UserRole.CITIZEN),
  jurisdictionDistrict: z.string().optional(),
  jurisdictionTehsil: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Location Schemas
export const createLocationSchema = z.object({
  state: z.string().default('Rajasthan'),
  district: z.string().min(1, 'District is required'),
  tehsil: z.string().min(1, 'Tehsil is required'),
  subDivision: z.string().optional(),
  village: z.string().min(1, 'Village is required'),
  censusCode: z.string().optional(),
  pincode: z.string().optional(),
});

// LandRecord & Parcel & Owner Schemas
export const createLandRecordSchema = z.object({
  ulpin: z.string().min(5, 'ULPIN is required'),
  khasraNumber: z.string().min(1, 'Khasra number is required'),
  khatauniNumber: z.string().min(1, 'Khatauni number is required'),
  locationId: z.string().uuid('Valid locationId is required').optional(),
  state: z.string().optional(),
  district: z.string().optional(),
  tehsil: z.string().optional(),
  village: z.string().optional(),
  areaInSqMeters: z.number().positive('Area must be positive'),
  areaUnit: z.nativeEnum(AreaUnit).default(AreaUnit.SQ_METERS),
  landType: z.nativeEnum(LandType).default(LandType.AGRICULTURAL),
  owners: z
    .array(
      z.object({
        fullName: z.string().min(1, 'Owner name is required'),
        relationType: z.string().optional(),
        guardianName: z.string().optional(),
        identifierMasked: z.string().optional(),
        shareFraction: z.number().min(0).max(1).default(1.0),
        isPrimary: z.boolean().default(true),
        mobileNumber: z.string().optional(),
        address: z.string().optional(),
      })
    )
    .min(1, 'At least one owner is required'),
  parcel: z
    .object({
      geometryJson: z.any(),
      centroidLat: z.number(),
      centroidLng: z.number(),
      crsProjection: z.string().default('EPSG:4326'),
      northBoundary: z.string().optional(),
      southBoundary: z.string().optional(),
      eastBoundary: z.string().optional(),
      westBoundary: z.string().optional(),
    })
    .optional(),
});

export const updateLandRecordSchema = z.object({
  status: z.nativeEnum(RecordStatus).optional(),
  landType: z.nativeEnum(LandType).optional(),
  areaInSqMeters: z.number().positive().optional(),
  areaUnit: z.nativeEnum(AreaUnit).optional(),
  khatauniNumber: z.string().optional(),
  owners: z
    .array(
      z.object({
        id: z.string().optional(),
        fullName: z.string().min(1),
        relationType: z.string().optional(),
        guardianName: z.string().optional(),
        identifierMasked: z.string().optional(),
        shareFraction: z.number().min(0).max(1).optional(),
        isPrimary: z.boolean().optional(),
        mobileNumber: z.string().optional(),
        address: z.string().optional(),
      })
    )
    .optional(),
});

export const searchRecordsQuerySchema = z.object({
  state: z.string().optional(),
  district: z.string().optional(),
  tehsil: z.string().optional(),
  village: z.string().optional(),
  owner: z.string().optional(),
  ownerName: z.string().optional(),
  khasraNumber: z.string().optional(),
  ulpin: z.string().optional(),
  status: z.nativeEnum(RecordStatus).optional(),
  landType: z.nativeEnum(LandType).optional(),
  minArea: z.string().optional(),
  maxArea: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 1)),
  limit: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 20)),
});

// Aliases
export const searchLandRecordsSchema = { query: searchRecordsQuerySchema };

// OCR & Document Schemas
export const startOcrJobSchema = z.object({
  documentId: z.string().uuid('Valid documentId is required'),
  engine: z.nativeEnum(OcrEngine).default(OcrEngine.HYBRID),
});

export const processOcrSchema = startOcrJobSchema;

export const verifyExtractedFieldSchema = z.object({
  verifiedValue: z.string().min(1, 'Verified value is required'),
});

export const correctFieldSchema = z.object({
  correctedValue: z.string().min(1, 'Corrected value is required'),
  reason: z.string().optional(),
});

export const rejectFieldSchema = z.object({
  reason: z.string().min(3, 'Rejection reason is required'),
});

export const sendBackCorrectionSchema = z.object({
  reason: z.string().min(5, 'Specific correction instructions are required'),
  requiredDocuments: z.array(z.string()).optional(),
});

export const approveCompleteRecordSchema = z.object({
  notes: z.string().optional(),
});

export const extractFieldsSchema = z.object({
  rawOcrText: z.string().min(1, 'Raw OCR text is required'),
  provider: z.enum(['gemini', 'gemini-ai', 'deterministic', 'rule-based']).optional(),
});

export const batchVerifyFieldsSchema = z.object({
  verifications: z.array(
    z.object({
      fieldId: z.string().uuid('Valid fieldId is required'),
      verifiedValue: z.string().min(1, 'Verified value is required'),
    })
  ),
  createOrUpdateRecord: z.boolean().optional().default(false),
});

export const validateRecordSchema = z.object({
  landRecordId: z.string().uuid('Valid landRecordId is required'),
});

export const runValidationSchema = validateRecordSchema;

export const resolveValidationIssueSchema = z.object({
  resolutionNotes: z.string().min(3, 'Resolution notes are required'),
});

// Conflict Resolution Schemas
export const resolveConflictSchema = z.object({
  status: z.nativeEnum(ConflictStatus),
  resolutionNotes: z.string().min(5, 'Resolution notes are required').optional(),
});

// Mutation / Request Schemas
export const createRequestSchema = z.object({
  landRecordId: z.string().optional().nullable(),
  requestType: z.nativeEnum(RequestType),
  metadata: z.record(z.any()).optional(),
  documentIds: z.array(z.string()).optional(),
});

export const updateRequestStageSchema = z.object({
  stage: z.nativeEnum(RequestStage),
  rejectionReason: z.string().optional(),
});
