import { apiClient } from './api';
import { OfficerDashboardStatsDTO, ApiResponse, LandRecordDTO } from '@land-digitization/shared';

export interface PendingQueueItem extends LandRecordDTO {
  latestValidation?: {
    id: string;
    isValid: boolean;
    overallScore: number;
    summary?: string;
    issuesCount: number;
    createdAt: string;
  } | null;
}

export interface OcrQueueItem {
  ocrResultId: string;
  documentId: string;
  fileName: string;
  fileType: string;
  filePath: string;
  documentType: string;
  status: string;
  confidenceScore: number;
  engine: string;
  pageCount: number;
  createdAt: string;
  landRecord?: {
    id: string;
    ulpin: string;
    khasraNumber: string;
    village?: string;
    district?: string;
    primaryOwner?: string;
  } | null;
  extractedFields: Array<{
    id: string;
    fieldName: string;
    fieldValue: string;
    confidence: number;
    isVerified: boolean;
    verifiedValue?: string | null;
  }>;
  lowConfidenceFieldsCount: number;
}

export interface ValidationConflictItem {
  id: string;
  validationResultId: string;
  ruleCode: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  description: string;
  details?: any;
  isResolved: boolean;
  createdAt: string;
  record?: {
    id: string;
    ulpin: string;
    khasraNumber: string;
    khatauniNumber: string;
    areaInSqMeters: number;
    village?: string;
    district?: string;
    primaryOwner?: string;
  } | null;
}

export interface DuplicateQueueItem {
  id: string;
  conflictType: string;
  overlapPercentage?: number | null;
  overlapAreaSqM?: number | null;
  status: string;
  resolutionNotes?: string | null;
  createdAt: string;
  primaryRecord?: {
    id: string;
    ulpin: string;
    khasraNumber: string;
    village?: string;
    district?: string;
    areaInSqMeters: number;
    primaryOwner?: string;
  } | null;
  conflictingRecord?: {
    id: string;
    ulpin: string;
    khasraNumber: string;
    village?: string;
    district?: string;
    areaInSqMeters: number;
    primaryOwner?: string;
  } | null;
  scoreBreakdown?: any;
}

export interface RecentActivityItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  timestamp: string;
  actor: {
    fullName: string;
    email: string;
    roleName: string;
  };
  snapshotDiff?: any;
}

export const officerService = {
  // Real Database Dashboard Stats
  async getStats(): Promise<OfficerDashboardStatsDTO> {
    const response = await apiClient.get<ApiResponse<OfficerDashboardStatsDTO>>('/officer/stats');
    return response.data.data!;
  },

  // Operational Queues
  async getPendingQueue(params?: { page?: number; limit?: number }) {
    const response = await apiClient.get<ApiResponse<PendingQueueItem[]>>('/officer/queues/pending', { params });
    return {
      items: response.data.data || [],
      pagination: response.data.pagination,
    };
  },

  async getOcrQueue(params?: { page?: number; limit?: number; threshold?: number }) {
    const response = await apiClient.get<ApiResponse<OcrQueueItem[]>>('/officer/queues/low-confidence-ocr', { params });
    return {
      items: response.data.data || [],
      pagination: response.data.pagination,
    };
  },

  async getValidationConflictsQueue(params?: { page?: number; limit?: number }) {
    const response = await apiClient.get<ApiResponse<ValidationConflictItem[]>>('/officer/queues/validation-conflicts', { params });
    return {
      items: response.data.data || [],
      pagination: response.data.pagination,
    };
  },

  async getDuplicatesQueue(params?: { page?: number; limit?: number }) {
    const response = await apiClient.get<ApiResponse<DuplicateQueueItem[]>>('/officer/queues/duplicate-candidates', { params });
    return {
      items: response.data.data || [],
      pagination: response.data.pagination,
    };
  },

  async getRecentActivity(limit: number = 15): Promise<RecentActivityItem[]> {
    const response = await apiClient.get<ApiResponse<RecentActivityItem[]>>('/officer/queues/recent-activity', {
      params: { limit },
    });
    return response.data.data || [];
  },

  // Officer Actions
  async approveRecord(recordId: string, remarks?: string) {
    const response = await apiClient.post<ApiResponse<LandRecordDTO>>(`/officer/records/${recordId}/approve`, { remarks });
    return response.data.data;
  },

  async rejectRecord(recordId: string, reason: string) {
    const response = await apiClient.post<ApiResponse<LandRecordDTO>>(`/officer/records/${recordId}/reject`, { reason });
    return response.data.data;
  },

  async runValidation(recordId: string) {
    const response = await apiClient.post<ApiResponse<any>>(`/officer/records/${recordId}/validate`);
    return response.data.data;
  },

  async resolveValidationIssue(issueId: string, notes?: string) {
    const response = await apiClient.patch<ApiResponse<any>>(`/officer/validation/issues/${issueId}/resolve`, { notes });
    return response.data.data;
  },

  async resolveConflict(conflictId: string, resolutionNotes: string, status: 'RESOLVED' | 'DISMISSED' = 'RESOLVED') {
    const response = await apiClient.patch<ApiResponse<any>>(`/conflicts/${conflictId}/resolve`, {
      resolutionNotes,
      status,
    });
    return response.data.data;
  },

  async correctOcrField(fieldId: string, correctedValue: string) {
    const response = await apiClient.post<ApiResponse<any>>(`/ocr/field/${fieldId}/correct`, {
      correctedValue,
    });
    return response.data.data;
  },
};
