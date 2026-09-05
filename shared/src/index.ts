/**
 * Core User & Authentication Types
 */
export enum UserRole {
  CITIZEN = 'CITIZEN',
  REVENUE_OFFICER = 'REVENUE_OFFICER',
  ADMIN = 'ADMIN',
}

export interface UserDTO {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  role: UserRole;
  jurisdictionDistrict?: string | null;
  jurisdictionTehsil?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: UserDTO;
  token: string;
  refreshToken?: string;
}

/**
 * Land Record Status & Classification
 */
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

export interface LandOwnerDTO {
  id: string;
  recordId: string;
  ownerName: string;
  identifierMasked?: string | null;
  relationType?: string | null; // e.g. "S/O", "D/O", "W/O"
  shareFraction: number; // e.g. 0.5 for 50%
  isPrimary: boolean;
}

export interface ParcelGeometryDTO {
  id: string;
  recordId: string;
  geometryJson: GeoJSONPolygon | GeoJSONMultiPolygon;
  centroidLat: number;
  centroidLng: number;
  crsProjection: string;
  boundaryHash?: string | null;
}

export interface LandRecordDTO {
  id: string;
  ulpin: string; // Unique Land Parcel Identification Number
  khasraNumber: string; // Survey/Khasra Number
  khatauniNumber: string; // Khatauni / Khatiyan Number
  district: string;
  tehsil: string;
  village: string;
  areaInSqMeters: number;
  areaUnit: AreaUnit;
  landType: LandType;
  status: RecordStatus;
  owners?: LandOwnerDTO[];
  geometry?: ParcelGeometryDTO | null;
  documents?: DocumentDTO[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Document & OCR Types
 */
export enum DocumentType {
  REGISTRATION_DEED = 'REGISTRATION_DEED',
  KHATAUNI_7_12 = 'KHATAUNI_7_12',
  MUTATION_CERTIFICATE = 'MUTATION_CERTIFICATE',
  ENCUMBRANCE_CERTIFICATE = 'ENCUMBRANCE_CERTIFICATE',
  SURVEY_MAP = 'SURVEY_MAP',
  IDENTITY_PROOF = 'IDENTITY_PROOF',
}

export interface DocumentDTO {
  id: string;
  recordId?: string | null;
  workflowId?: string | null;
  fileName: string;
  fileType: string;
  filePath: string;
  fileSize: number;
  fileHash: string; // SHA-256
  documentType: DocumentType;
  uploadedById: string;
  createdAt: string;
}

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

export interface ExtractionJobDTO {
  id: string;
  documentId: string;
  status: JobStatus;
  rawOcrText?: string | null;
  extractedFields?: Record<string, any> | null;
  confidenceScore?: number | null;
  ocrEngine: OcrEngine;
  completedAt?: string | null;
}

/**
 * Validation & Conflict Types
 */
export enum ConflictType {
  SPATIAL_OVERLAP = 'SPATIAL_OVERLAP',
  DUPLICATE_KHASRA = 'DUPLICATE_KHASRA',
  TITLE_DISPUTE = 'TITLE_DISPUTE',
  SHARE_SUM_MISMATCH = 'SHARE_SUM_MISMATCH',
  AREA_DISCREPANCY = 'AREA_DISCREPANCY',
}

export enum ConflictStatus {
  OPEN = 'OPEN',
  INVESTIGATING = 'INVESTIGATING',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED',
}

export interface DuplicateConflictDTO {
  id: string;
  recordAId: string;
  recordBId?: string | null;
  conflictType: ConflictType;
  overlapPercentage?: number | null;
  status: ConflictStatus;
  resolutionNotes?: string | null;
  resolvedById?: string | null;
  resolvedAt?: string | null;
  recordA?: LandRecordDTO;
  recordB?: LandRecordDTO;
  createdAt: string;
}

export interface ValidationRuleResult {
  ruleId: string;
  ruleName: string;
  passed: boolean;
  severity: 'ERROR' | 'WARNING' | 'INFO';
  message: string;
  details?: Record<string, any>;
}

export interface ValidationReportDTO {
  id: string;
  recordId: string;
  isValid: boolean;
  score: number; // 0 to 100
  ruleResults: ValidationRuleResult[];
  createdAt: string;
}

/**
 * Workflows & Mutation Requests
 */
export enum WorkflowType {
  SALE_MUTATION = 'SALE_MUTATION',
  INHERITANCE = 'INHERITANCE',
  PARTITION = 'PARTITION',
  DIGITIZATION_NEW = 'DIGITIZATION_NEW',
}

export enum WorkflowStage {
  SUBMITTED = 'SUBMITTED',
  DOCUMENT_VERIFICATION = 'DOCUMENT_VERIFICATION',
  FIELD_SURVEY = 'FIELD_SURVEY',
  OBJECTION_WINDOW = 'OBJECTION_WINDOW',
  FINAL_APPROVAL = 'FINAL_APPROVAL',
  REJECTED = 'REJECTED',
}

export interface MutationRequestDTO {
  id: string;
  applicationNo: string;
  recordId?: string | null;
  applicantId: string;
  requestType: WorkflowType;
  stage: WorkflowStage;
  assignedOfficerId?: string | null;
  rejectionReason?: string | null;
  metadata?: Record<string, any> | null;
  applicant?: UserDTO;
  record?: LandRecordDTO | null;
  documents?: DocumentDTO[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Audit Logging
 */
export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  VERIFY = 'VERIFY',
  APPROVE_MUTATION = 'APPROVE_MUTATION',
  REJECT_MUTATION = 'REJECT_MUTATION',
  RESOLVE_CONFLICT = 'RESOLVE_CONFLICT',
  RUN_OCR = 'RUN_OCR',
  EXPORT_RECORD = 'EXPORT_RECORD',
}

export interface AuditLogDTO {
  id: string;
  actorId: string;
  actorRole: UserRole;
  action: AuditAction;
  entityType: string;
  entityId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  snapshotDiff?: Record<string, any> | null;
  timestamp: string;
  actor?: {
    fullName: string;
    email: string;
  };
}

/**
 * GeoJSON Standard Types
 */
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
  geometry: G;
  properties: P;
  id?: string | number;
}

export interface GeoJSONFeatureCollection<G = GeoJSONPolygon | GeoJSONMultiPolygon, P = Record<string, any>> {
  type: 'FeatureCollection';
  features: GeoJSONFeature<G, P>[];
}

/**
 * Standard API Response Format
 */
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
