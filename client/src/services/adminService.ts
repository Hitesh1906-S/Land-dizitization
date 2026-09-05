import { apiClient } from './api';
import {
  AdminDashboardStatsDTO,
  ValidationMetricsDTO,
  ApiResponse,
  UserRole,
  RecordStatus,
  RequestStage,
  AuditAction,
} from '@land-digitization/shared';

export interface AdminUserItem {
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
  metrics: {
    createdRecordsCount: number;
    submittedRequestsCount: number;
    assignedRequestsCount: number;
    auditLogsCount: number;
  };
}

export interface AdminRoleItem {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  usersCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminRecordItem {
  id: string;
  ulpin: string;
  khasraNumber: string;
  khatauniNumber: string;
  areaInSqMeters: number;
  areaUnit: string;
  landType: string;
  status: RecordStatus;
  location?: {
    id: string;
    state: string;
    district: string;
    tehsil: string;
    village: string;
  };
  primaryOwner?: string;
  ownersCount: number;
  hasGeometry: boolean;
  documentsCount: number;
  latestValidation?: {
    isValid: boolean;
    score: number;
  } | null;
  createdBy?: {
    fullName: string;
    email: string;
    roleName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AdminRequestItem {
  id: string;
  applicationNumber: string;
  requestType: string;
  stage: RequestStage;
  applicant: {
    id: string;
    fullName: string;
    email: string;
    phone?: string | null;
  };
  assignedOfficer?: {
    id: string;
    fullName: string;
    email: string;
    jurisdictionTehsil?: string | null;
  } | null;
  landRecord?: {
    id: string;
    ulpin: string;
    khasraNumber: string;
    village?: string;
    district?: string;
  } | null;
  documentsCount: number;
  documents: Array<{
    id: string;
    fileName: string;
    documentType: string;
    fileSize: number;
  }>;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminValidationIssueItem {
  id: string;
  ruleCode: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  description: string;
  isResolved: boolean;
  resolvedAt?: string | null;
  record?: {
    id: string;
    ulpin: string;
    khasraNumber: string;
    village?: string;
    district?: string;
  } | null;
}

export interface AdminAuditLogItem {
  id: string;
  actorId: string;
  actorRole: string;
  action: AuditAction | string;
  entityType: string;
  entityId: string;
  ipAddress: string;
  snapshotDiff?: any;
  timestamp: string;
  actor: {
    fullName: string;
    email: string;
    roleName: string;
  };
}

export const adminService = {
  // Stats
  async getStats(): Promise<AdminDashboardStatsDTO> {
    const response = await apiClient.get<ApiResponse<AdminDashboardStatsDTO>>('/admin/stats');
    return response.data.data!;
  },

  // 1. User Management
  async getUsers(params?: {
    role?: string;
    isActive?: boolean;
    search?: string;
    district?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await apiClient.get<ApiResponse<AdminUserItem[]>>('/admin/users', { params });
    return {
      users: response.data.data || [],
      pagination: response.data.pagination,
    };
  },

  async getUserById(id: string): Promise<AdminUserItem> {
    const response = await apiClient.get<ApiResponse<AdminUserItem>>(`/admin/users/${id}`);
    return response.data.data!;
  },

  async createUser(data: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    role: UserRole;
    jurisdictionDistrict?: string;
    jurisdictionTehsil?: string;
  }): Promise<AdminUserItem> {
    const response = await apiClient.post<ApiResponse<AdminUserItem>>('/admin/users', data);
    return response.data.data!;
  },

  async updateUser(
    id: string,
    data: {
      fullName?: string;
      phone?: string;
      role?: UserRole;
      jurisdictionDistrict?: string;
      jurisdictionTehsil?: string;
      isActive?: boolean;
    }
  ): Promise<AdminUserItem> {
    const response = await apiClient.patch<ApiResponse<AdminUserItem>>(`/admin/users/${id}`, data);
    return response.data.data!;
  },

  async toggleUserStatus(id: string): Promise<any> {
    const response = await apiClient.patch<ApiResponse<any>>(`/admin/users/${id}/toggle-status`);
    return response.data.data!;
  },

  // 2. Role Management
  async getRoles(): Promise<AdminRoleItem[]> {
    const response = await apiClient.get<ApiResponse<AdminRoleItem[]>>('/admin/roles');
    return response.data.data || [];
  },

  async updateRolePermissions(roleId: string, permissions: string[], description?: string): Promise<any> {
    const response = await apiClient.patch<ApiResponse<any>>(`/admin/roles/${roleId}`, {
      permissions,
      description,
    });
    return response.data.data!;
  },

  // 3. Land Record Governance
  async getRecords(params?: {
    status?: string;
    landType?: string;
    search?: string;
    district?: string;
    village?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await apiClient.get<ApiResponse<AdminRecordItem[]>>('/admin/records', { params });
    return {
      records: response.data.data || [],
      pagination: response.data.pagination,
    };
  },

  async updateRecordStatus(recordId: string, status: RecordStatus, remarks?: string): Promise<any> {
    const response = await apiClient.patch<ApiResponse<any>>(`/admin/records/${recordId}/status`, {
      status,
      remarks,
    });
    return response.data.data!;
  },

  // 4. Request Governance
  async getRequests(params?: {
    stage?: string;
    requestType?: string;
    assignedOfficerId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await apiClient.get<ApiResponse<AdminRequestItem[]>>('/admin/requests', { params });
    return {
      requests: response.data.data || [],
      pagination: response.data.pagination,
    };
  },

  async assignOfficer(requestId: string, officerId: string): Promise<any> {
    const response = await apiClient.patch<ApiResponse<any>>(`/admin/requests/${requestId}/assign`, {
      officerId,
    });
    return response.data.data!;
  },

  async updateRequestStage(requestId: string, stage: RequestStage, reason?: string): Promise<any> {
    const response = await apiClient.patch<ApiResponse<any>>(`/admin/requests/${requestId}/stage`, {
      stage,
      reason,
    });
    return response.data.data!;
  },

  // 5. Validation Monitoring
  async getValidationMetrics(): Promise<ValidationMetricsDTO> {
    const response = await apiClient.get<ApiResponse<ValidationMetricsDTO>>('/admin/validation/metrics');
    return response.data.data!;
  },

  async getValidationIssues(params?: {
    severity?: string;
    ruleCode?: string;
    isResolved?: boolean;
    page?: number;
    limit?: number;
  }) {
    const response = await apiClient.get<ApiResponse<AdminValidationIssueItem[]>>('/admin/validation/issues', {
      params,
    });
    return {
      issues: response.data.data || [],
      pagination: response.data.pagination,
    };
  },

  // 6. Audit Trail
  async getAuditLogs(params?: {
    action?: string;
    entityType?: string;
    actorId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await apiClient.get<ApiResponse<AdminAuditLogItem[]>>('/admin/audit-logs', { params });
    return {
      logs: response.data.data || [],
      pagination: response.data.pagination,
    };
  },
};
