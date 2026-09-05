/**
 * BhoomiSetu Shared Domain Types & Normalized Contracts
 */

// 1. Roles & Permissions
export enum UserRole {
  CITIZEN = 'CITIZEN',
  REVENUE_OFFICER = 'REVENUE_OFFICER',
  ADMIN = 'ADMIN',
}

export interface RoleDTO {
  id: string;
  name: UserRole;
  description: string;
  permissions?: string[];
}

// 2. User
export interface UserDTO {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  role: UserRole;
  jurisdictionDistrict?: string | null;
  jurisdictionTehsil?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: UserDTO;
  token: string;
  refreshToken?: string;
}

// 3. Location (Hierarchical administrative unit)
export interface LocationDTO {
  id: string;
  state: string;
  district: string;
  tehsil: string;
  subDivision?: string | null;
  village: string;
  censusCode?: string | null;
  pincode?: string | null;
  createdAt: string;
  updatedAt: string;
}

// 4. LandRecord Status & Classifications
export enum RecordStatus {
  DRAFT = 'DRAFT',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  VERIFIED = 'VERIFIED',
  DISPUTED = 'DISPUTED',
  ARCHIVED = 'ARCHIVED',
}

export enum LandType {
  AGRICULTURAL = 'AGRICULTURAL',
  RESIDENTIAL = 'RESIDENTIAL',
  COMMERCIAL = 'COMMERCIAL',
  INDUSTRIAL = 'INDUSTRIAL',
  FOREST = 'FOREST',
  GOVERNMENT = 'GOVERNMENT',
}

export enum AreaUnit {
  SQ_METERS = 'SQ_METERS',
  HECTARES = 'HECTARES',
  ACRES = 'ACRES',
  BIGHA = 'BIGHA',
  GUNTHA = 'GUNTHA',
}

export interface LandRecordDTO {
  id: string;
  ulpin: string; // Unique Land Parcel Identification Number
  khasraNumber: string;
  khatauniNumber: string;
  locationId: string;
  location?: LocationDTO;
  areaInSqMeters: number;
  areaUnit: AreaUnit;
  landType: LandType;
  status: RecordStatus;
  createdById: string;
  createdBy?: UserDTO;
  owners?: OwnerDTO[];
  parcel?: ParcelDTO | null;
  documents?: DocumentDTO[];
  ownershipHistory?: OwnershipHistoryDTO[];
  createdAt: string;
  updatedAt: string;
}

// 5. Owner
export interface OwnerDTO {
  id: string;
  landRecordId: string;
  fullName: string;
  identifierMasked?: string | null; // Masked Aadhaar / PAN hash
  relationType?: string | null; // S/O, D/O, W/O
  guardianName?: string | null;
  shareFraction: number; // 0.0 to 1.0 (e.g. 0.50 for 50%)
  isPrimary: boolean;
  mobileNumber?: string | null;
  address?: string | null;
  addedAt: string;
}

// 6. OwnershipHistory
export enum MutationType {
  SALE = 'SALE',
  INHERITANCE = 'INHERITANCE',
  GIFT = 'GIFT',
  PARTITION = 'PARTITION',
  GOVERNMENT_ACQUISITION = 'GOVERNMENT_ACQUISITION',
}

export interface OwnershipHistoryDTO {
  id: string;
  landRecordId: string;
  previousOwnerName: string;
  newOwnerName: string;
  mutationType: MutationType;
  mutationOrderNumber: string;
  mutationDate: string;
  transferredShare: number;
  recordedById: string;
  createdAt: string;
}

// 7. Parcel (GIS Geometry)
export type Position = [number, number] | [number, number, number]; // [lng, lat]

export interface GeoJSONPolygon {
  type: 'Polygon';
  coordinates: Position[][];
}

export interface GeoJSONMultiPolygon {
  type: 'MultiPolygon';
  coordinates: Position[][][];
}

export interface GeoJSONFeature<G = GeoJSONPolygon | GeoJSONMultiPolygon, P = Record<string, any>> {
  type: 'Feature';
  id?: string | number;
  geometry: G;
  properties: P;
  bbox?: number[];
}

export interface GeoJSONFeatureCollection<G = GeoJSONPolygon | GeoJSONMultiPolygon, P = Record<string, any>> {
  type: 'FeatureCollection';
  features: GeoJSONFeature<G, P>[];
}

export interface ParcelDTO {
  id: string;
  landRecordId: string;
  geometryJson: GeoJSONPolygon | GeoJSONMultiPolygon;
  centroidLat: number;
  centroidLng: number;
  crsProjection: string;
  boundaryHash?: string | null;
  northBoundary?: string | null;
  southBoundary?: string | null;
  eastBoundary?: string | null;
  westBoundary?: string | null;
  createdAt: string;
  updatedAt: string;
}

// 8. Document
export enum DocumentType {
  REGISTRATION_DEED = 'REGISTRATION_DEED',
  KHATAUNI_7_12 = 'KHATAUNI_7_12',
  MUTATION_SANCTION = 'MUTATION_SANCTION',
  MUTATION_CERTIFICATE = 'MUTATION_CERTIFICATE',
  ENCUMBRANCE_CERTIFICATE = 'ENCUMBRANCE_CERTIFICATE',
  SURVEY_MAP = 'SURVEY_MAP',
  IDENTITY_PROOF = 'IDENTITY_PROOF',
}

export interface DocumentDTO {
  id: string;
  landRecordId?: string | null;
  requestId?: string | null;
  fileName: string;
  fileType: string;
  filePath: string;
  fileSize: number;
  fileHash: string; // SHA-256
  documentType: DocumentType;
  uploadedById: string;
  createdAt: string;
  ocrResult?: OCRResultDTO | null;
}

// 9. OCRResult & ExtractedField
export enum OcrEngine {
  TESSERACT = 'TESSERACT',
  GEMINI_VISION = 'GEMINI_VISION',
  HYBRID = 'HYBRID',
}

export enum JobStatus {
  QUEUED = 'QUEUED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface OCRResultDTO {
  id: string;
  documentId: string;
  status: JobStatus;
  rawText?: string | null;
  confidenceScore?: number | null;
  engine: OcrEngine;
  pageCount: number;
  processingTimeMs?: number | null;
  completedAt?: string | null;
  extractedFields?: ExtractedFieldDTO[];
  createdAt: string;
}

export interface ExtractedFieldDTO {
  id: string;
  ocrResultId: string;
  fieldName: string;
  fieldValue: string;
  confidence: number;
  boundingBoxJson?: Record<string, any> | string | null;
  isVerified: boolean;
  verifiedValue?: string | null;
  verifiedById?: string | null;
  createdAt: string;
}

// 10. ValidationResult & ValidationIssue
export enum IssueSeverity {
  CRITICAL = 'CRITICAL',
  WARNING = 'WARNING',
  INFO = 'INFO',
}

export enum RuleCode {
  SYNTAX_INVALID = 'SYNTAX_INVALID',
  SHARE_SUM_MISMATCH = 'SHARE_SUM_MISMATCH',
  AREA_DEVIATION = 'AREA_DEVIATION',
  SPATIAL_OVERLAP = 'SPATIAL_OVERLAP',
  DUPLICATE_KHASRA = 'DUPLICATE_KHASRA',
  UNVERIFIED_OWNER = 'UNVERIFIED_OWNER',
}

export interface ValidationIssueDTO {
  id: string;
  validationResultId: string;
  ruleCode: RuleCode | string;
  severity: IssueSeverity | 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  description: string;
  detailsJson?: Record<string, any> | string | null;
  isResolved: boolean;
  resolvedById?: string | null;
  resolvedAt?: string | null;
}

export interface ValidationResultDTO {
  id: string;
  landRecordId: string;
  isValid: boolean;
  overallScore: number; // 0 - 100
  summary?: string | null;
  executedById: string;
  issues?: ValidationIssueDTO[];
  createdAt: string;
}

// 11. DuplicateCandidate & Conflicts
export enum ConflictType {
  SPATIAL_OVERLAP = 'SPATIAL_OVERLAP',
  DUPLICATE_KHASRA = 'DUPLICATE_KHASRA',
  TITLE_DISPUTE = 'TITLE_DISPUTE',
  SHARE_EXCESS = 'SHARE_EXCESS',
  FUZZY_MATCH = 'FUZZY_MATCH',
  FUZZY_DUPLICATE = 'FUZZY_DUPLICATE',
  OWNER_CLASH = 'OWNER_CLASH',
  AREA_DISCREPANCY = 'AREA_DISCREPANCY',
}

export enum ConflictStatus {
  OPEN = 'OPEN',
  INVESTIGATING = 'INVESTIGATING',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED',
}

export interface DuplicateScoreBreakdown {
  khasraScore: number;       // 0 - 100
  ownerScore: number;        // 0 - 100
  locationScore: number;     // 0 - 100
  areaScore: number;         // 0 - 100
  registrationScore: number; // 0 - 100
  compositeScore: number;    // 0 - 100
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  matchReasons: string[];
}

export interface DuplicateCandidateDTO {
  id: string;
  primaryRecordId: string;
  conflictingRecordId?: string | null;
  conflictType: ConflictType;
  overlapPercentage?: number | null;
  overlapAreaSqM?: number | null;
  status: ConflictStatus;
  resolutionNotes?: string | null;
  resolvedById?: string | null;
  resolvedAt?: string | null;
  primaryRecord?: LandRecordDTO;
  conflictingRecord?: LandRecordDTO | null;
  scoreBreakdown?: DuplicateScoreBreakdown | null;
  createdAt: string;
  updatedAt: string;
}

export interface DuplicateScanResultDTO {
  scannedRecordId?: string;
  totalEvaluated: number;
  candidatesFound: number;
  candidates: DuplicateCandidateDTO[];
}

// 12. Request (Mutation / Digitization Lifecycle)
export enum RequestType {
  SALE_MUTATION = 'SALE_MUTATION',
  INHERITANCE = 'INHERITANCE',
  PARTITION = 'PARTITION',
  NEW_DIGITIZATION = 'NEW_DIGITIZATION',
  DIGITIZATION_NEW = 'NEW_DIGITIZATION',
}

export enum RequestStage {
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  PROCESSING = 'PROCESSING',
  NEEDS_CORRECTION = 'NEEDS_CORRECTION',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  // Legacy compatibility mappings
  DOCUMENT_VERIFICATION = 'UNDER_REVIEW',
  FIELD_SURVEY = 'PROCESSING',
  OBJECTION_WINDOW = 'PROCESSING',
  FINAL_APPROVAL = 'VERIFIED',
}

// Aliases for compatibility
export const WorkflowType = RequestType;
export type WorkflowType = RequestType;
export const WorkflowStage = RequestStage;
export type WorkflowStage = RequestStage;

export interface RequestDTO {
  id: string;
  applicationNumber: string;
  landRecordId?: string | null;
  applicantId: string;
  requestType: RequestType;
  stage: RequestStage;
  assignedOfficerId?: string | null;
  rejectionReason?: string | null;
  metadataJson?: Record<string, any> | string | null;
  applicant?: UserDTO;
  assignedOfficer?: UserDTO | null;
  landRecord?: LandRecordDTO | null;
  documents?: DocumentDTO[];
  createdAt: string;
  updatedAt: string;
}

// 13. AuditLog
export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  VERIFY = 'VERIFY',
  APPROVE_MUTATION = 'APPROVE_MUTATION',
  REJECT_MUTATION = 'REJECT_MUTATION',
  RESOLVE_CONFLICT = 'RESOLVE_CONFLICT',
  RUN_OCR = 'RUN_OCR',
  EXPORT_DATA = 'EXPORT_DATA',
}

export interface AuditLogDTO {
  id: string;
  actorId: string;
  actorRole: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  snapshotDiffJson?: Record<string, any> | string | null;
  snapshotDiff?: string | null;
  timestamp: string;
  actor?: {
    fullName: string;
    email: string;
  };
}

// 14. Officer Dashboard & Operations
export interface OfficerDashboardStatsDTO {
  totalRecords: number;
  digitized: number;
  verified: number;
  pending: number;
  conflicts: number;
  duplicates: number;
}

// Standard API Response Wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  timestamp: string;
}

