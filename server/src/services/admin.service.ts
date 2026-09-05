import { prisma } from '../config/database';
import { NotFoundError, BadRequestError, ConflictError } from '../utils/AppError';
import {
  UserRole,
  RecordStatus,
  RequestStage,
  AuditAction,
  AdminDashboardStatsDTO,
  ValidationMetricsDTO,
} from '@land-digitization/shared';
import bcrypt from 'bcryptjs';

export class AdminService {
  /**
   * 1. Dashboard Metrics aggregated from real database queries
   */
  static async getDashboardStats(): Promise<AdminDashboardStatsDTO> {
    const [
      totalUsers,
      activeUsers,
      totalOfficers,
      totalCitizens,
      totalAdmins,
      totalRecords,
      totalRequests,
      pendingRequests,
      unresolvedIssues,
      totalAuditLogs,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { roleName: UserRole.REVENUE_OFFICER } }),
      prisma.user.count({ where: { roleName: UserRole.CITIZEN } }),
      prisma.user.count({ where: { roleName: UserRole.ADMIN } }),
      prisma.landRecord.count(),
      prisma.request.count(),
      prisma.request.count({
        where: {
          stage: { notIn: [RequestStage.VERIFIED, RequestStage.REJECTED, 'FINAL_APPROVAL'] },
        },
      }),
      prisma.validationIssue.count({ where: { isResolved: false } }),
      prisma.auditLog.count(),
    ]);

    return {
      totalUsers,
      activeUsers,
      totalOfficers,
      totalCitizens,
      totalAdmins,
      totalRecords,
      totalRequests,
      pendingRequests,
      unresolvedIssues,
      totalAuditLogs,
    };
  }

  /**
   * 2. User Management - Server-side paginated & filtered (Strictly excludes passwordHash)
   */
  static async getUsers(options: {
    role?: string;
    isActive?: boolean;
    search?: string;
    district?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (options.role) {
      where.roleName = options.role;
    }

    if (options.isActive !== undefined) {
      where.isActive = options.isActive;
    }

    if (options.district) {
      where.jurisdictionDistrict = { contains: options.district.trim() };
    }

    if (options.search && options.search.trim()) {
      const q = options.search.trim();
      where.OR = [
        { email: { contains: q } },
        { fullName: { contains: q } },
        { phone: { contains: q } },
        { jurisdictionDistrict: { contains: q } },
        { jurisdictionTehsil: { contains: q } },
      ];
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          roleName: true,
          jurisdictionDistrict: true,
          jurisdictionTehsil: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              createdRecords: true,
              submittedRequests: true,
              assignedRequests: true,
              auditLogs: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        fullName: u.fullName,
        phone: u.phone,
        role: u.roleName as UserRole,
        jurisdictionDistrict: u.jurisdictionDistrict,
        jurisdictionTehsil: u.jurisdictionTehsil,
        isActive: u.isActive,
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
        metrics: {
          createdRecordsCount: u._count.createdRecords,
          submittedRequestsCount: u._count.submittedRequests,
          assignedRequestsCount: u._count.assignedRequests,
          auditLogsCount: u._count.auditLogs,
        },
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  static async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        roleName: true,
        jurisdictionDistrict: true,
        jurisdictionTehsil: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            createdRecords: true,
            submittedRequests: true,
            assignedRequests: true,
            auditLogs: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError(`User with ID ${id} not found`);
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: user.roleName as UserRole,
      jurisdictionDistrict: user.jurisdictionDistrict,
      jurisdictionTehsil: user.jurisdictionTehsil,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      metrics: {
        createdRecordsCount: user._count.createdRecords,
        submittedRequestsCount: user._count.submittedRequests,
        assignedRequestsCount: user._count.assignedRequests,
        auditLogsCount: user._count.auditLogs,
      },
    };
  }

  static async createUser(
    data: {
      email: string;
      password: string;
      fullName: string;
      phone?: string;
      role: UserRole;
      jurisdictionDistrict?: string;
      jurisdictionTehsil?: string;
    },
    adminId: string
  ) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase().trim() },
    });

    if (existing) {
      throw new ConflictError(`User with email ${data.email} already exists`);
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    // Find role entity if exists
    const roleRecord = await prisma.role.findUnique({
      where: { name: data.role },
    });

    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase().trim(),
        passwordHash,
        fullName: data.fullName.trim(),
        phone: data.phone?.trim() || null,
        roleId: roleRecord?.id || null,
        roleName: data.role,
        jurisdictionDistrict: data.jurisdictionDistrict?.trim() || null,
        jurisdictionTehsil: data.jurisdictionTehsil?.trim() || null,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        roleName: true,
        jurisdictionDistrict: true,
        jurisdictionTehsil: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Record Audit Log
    await prisma.auditLog.create({
      data: {
        actorId: adminId,
        actorRole: UserRole.ADMIN,
        action: AuditAction.CREATE,
        entityType: 'User',
        entityId: user.id,
        snapshotDiffJson: JSON.stringify({
          email: user.email,
          role: user.roleName,
          fullName: user.fullName,
          district: user.jurisdictionDistrict,
        }),
      },
    });

    return {
      ...user,
      role: user.roleName as UserRole,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  static async updateUser(
    id: string,
    data: {
      fullName?: string;
      phone?: string;
      role?: UserRole;
      jurisdictionDistrict?: string;
      jurisdictionTehsil?: string;
      isActive?: boolean;
    },
    adminId: string
  ) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundError(`User with ID ${id} not found`);
    }

    let roleId = user.roleId;
    if (data.role && data.role !== user.roleName) {
      const r = await prisma.role.findUnique({ where: { name: data.role } });
      if (r) roleId = r.id;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        fullName: data.fullName?.trim() ?? user.fullName,
        phone: data.phone !== undefined ? data.phone?.trim() || null : user.phone,
        roleName: data.role ?? user.roleName,
        roleId,
        jurisdictionDistrict:
          data.jurisdictionDistrict !== undefined
            ? data.jurisdictionDistrict?.trim() || null
            : user.jurisdictionDistrict,
        jurisdictionTehsil:
          data.jurisdictionTehsil !== undefined
            ? data.jurisdictionTehsil?.trim() || null
            : user.jurisdictionTehsil,
        isActive: data.isActive !== undefined ? data.isActive : user.isActive,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        roleName: true,
        jurisdictionDistrict: true,
        jurisdictionTehsil: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Record Audit Log
    await prisma.auditLog.create({
      data: {
        actorId: adminId,
        actorRole: UserRole.ADMIN,
        action: AuditAction.UPDATE,
        entityType: 'User',
        entityId: id,
        snapshotDiffJson: JSON.stringify({
          previousRole: user.roleName,
          newRole: updated.roleName,
          previousActive: user.isActive,
          newActive: updated.isActive,
          changes: data,
        }),
      },
    });

    return {
      ...updated,
      role: updated.roleName as UserRole,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  static async toggleUserStatus(id: string, adminId: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundError(`User with ID ${id} not found`);
    }

    const newStatus = !user.isActive;

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: newStatus },
      select: {
        id: true,
        email: true,
        fullName: true,
        roleName: true,
        isActive: true,
        updatedAt: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: adminId,
        actorRole: UserRole.ADMIN,
        action: AuditAction.UPDATE,
        entityType: 'UserStatus',
        entityId: id,
        snapshotDiffJson: JSON.stringify({
          action: newStatus ? 'USER_ACCOUNT_ACTIVATED' : 'USER_ACCOUNT_SUSPENDED',
          email: user.email,
          previousState: user.isActive,
          newState: newStatus,
        }),
      },
    });

    return updated;
  }

  /**
   * 3. Role Management
   */
  static async getRoles() {
    const roles = await prisma.role.findMany({
      include: {
        _count: {
          select: { users: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return roles.map((r) => {
      let parsedPermissions: string[] = [];
      if (r.permissions) {
        try {
          parsedPermissions = JSON.parse(r.permissions);
        } catch {
          parsedPermissions = [];
        }
      }

      return {
        id: r.id,
        name: r.name,
        description: r.description,
        permissions: parsedPermissions,
        usersCount: r._count.users,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      };
    });
  }

  static async updateRolePermissions(
    roleId: string,
    permissions: string[],
    description?: string,
    adminId?: string
  ) {
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundError(`Role ${roleId} not found`);
    }

    const updated = await prisma.role.update({
      where: { id: roleId },
      data: {
        permissions: JSON.stringify(permissions),
        description: description ?? role.description,
      },
    });

    if (adminId) {
      await prisma.auditLog.create({
        data: {
          actorId: adminId,
          actorRole: UserRole.ADMIN,
          action: AuditAction.UPDATE,
          entityType: 'RolePermission',
          entityId: roleId,
          snapshotDiffJson: JSON.stringify({
            role: role.name,
            permissionsCount: permissions.length,
            permissions,
          }),
        },
      });
    }

    return updated;
  }

  /**
   * 4. Land Record Governance - Server-side paginated & multi-filtered
   */
  static async getRecords(options: {
    status?: string;
    landType?: string;
    search?: string;
    district?: string;
    village?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (options.status) {
      where.status = options.status;
    }
    if (options.landType) {
      where.landType = options.landType;
    }
    if (options.district || options.village) {
      where.location = {};
      if (options.district) where.location.district = { contains: options.district.trim() };
      if (options.village) where.location.village = { contains: options.village.trim() };
    }
    if (options.search && options.search.trim()) {
      const q = options.search.trim();
      where.OR = [
        { khasraNumber: { contains: q } },
        { ulpin: { contains: q } },
        { khatauniNumber: { contains: q } },
        { owners: { some: { fullName: { contains: q } } } },
      ];
    }

    const [total, records] = await Promise.all([
      prisma.landRecord.count({ where }),
      prisma.landRecord.findMany({
        where,
        skip,
        take: limit,
        include: {
          location: true,
          owners: true,
          parcel: true,
          createdBy: {
            select: { fullName: true, email: true, roleName: true },
          },
          documents: {
            select: { id: true, fileName: true, documentType: true },
          },
          validationResults: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    return {
      records: records.map((r) => ({
        id: r.id,
        ulpin: r.ulpin,
        khasraNumber: r.khasraNumber,
        khatauniNumber: r.khatauniNumber,
        areaInSqMeters: r.areaInSqMeters,
        areaUnit: r.areaUnit,
        landType: r.landType,
        status: r.status as RecordStatus,
        location: r.location,
        primaryOwner: r.owners.find((o) => o.isPrimary)?.fullName || r.owners[0]?.fullName,
        ownersCount: r.owners.length,
        hasGeometry: !!r.parcel,
        documentsCount: r.documents.length,
        latestValidation: r.validationResults[0]
          ? {
              isValid: r.validationResults[0].isValid,
              score: r.validationResults[0].overallScore,
            }
          : null,
        createdBy: r.createdBy,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  static async updateRecordStatus(
    recordId: string,
    status: RecordStatus,
    remarks: string,
    adminId: string
  ) {
    const record = await prisma.landRecord.findUnique({
      where: { id: recordId },
      include: { location: true },
    });

    if (!record) {
      throw new NotFoundError(`Land record with ID ${recordId} not found`);
    }

    const previousStatus = record.status;

    const updated = await prisma.landRecord.update({
      where: { id: recordId },
      data: { status },
      include: { location: true, owners: true },
    });

    await prisma.auditLog.create({
      data: {
        actorId: adminId,
        actorRole: UserRole.ADMIN,
        action: AuditAction.UPDATE,
        entityType: 'LandRecordStatusOverride',
        entityId: recordId,
        snapshotDiffJson: JSON.stringify({
          action: 'ADMIN_RECORD_STATUS_OVERRIDE',
          ulpin: record.ulpin,
          khasraNumber: record.khasraNumber,
          previousStatus,
          newStatus: status,
          adminRemarks: remarks || 'Status updated by System Administrator',
        }),
      },
    });

    return updated;
  }

  /**
   * 5. Request Governance - Server-side paginated & filtered
   */
  static async getRequests(options: {
    stage?: string;
    requestType?: string;
    assignedOfficerId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (options.stage) {
      where.stage = options.stage;
    }
    if (options.requestType) {
      where.requestType = options.requestType;
    }
    if (options.assignedOfficerId) {
      where.assignedOfficerId = options.assignedOfficerId;
    }
    if (options.search && options.search.trim()) {
      const q = options.search.trim();
      where.OR = [
        { applicationNumber: { contains: q } },
        { applicant: { fullName: { contains: q } } },
        { applicant: { email: { contains: q } } },
      ];
    }

    const [total, requests] = await Promise.all([
      prisma.request.count({ where }),
      prisma.request.findMany({
        where,
        skip,
        take: limit,
        include: {
          applicant: {
            select: { id: true, fullName: true, email: true, phone: true },
          },
          assignedOfficer: {
            select: { id: true, fullName: true, email: true, jurisdictionTehsil: true },
          },
          landRecord: {
            include: { location: true },
          },
          documents: {
            select: { id: true, fileName: true, documentType: true, fileSize: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      requests: requests.map((r) => ({
        id: r.id,
        applicationNumber: r.applicationNumber,
        requestType: r.requestType,
        stage: r.stage,
        applicant: r.applicant,
        assignedOfficer: r.assignedOfficer,
        landRecord: r.landRecord
          ? {
              id: r.landRecord.id,
              ulpin: r.landRecord.ulpin,
              khasraNumber: r.landRecord.khasraNumber,
              village: r.landRecord.location?.village,
              district: r.landRecord.location?.district,
            }
          : null,
        documentsCount: r.documents.length,
        documents: r.documents,
        rejectionReason: r.rejectionReason,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  static async assignOfficer(requestId: string, officerId: string, adminId: string) {
    const request = await prisma.request.findUnique({ where: { id: requestId } });
    if (!request) {
      throw new NotFoundError(`Request ${requestId} not found`);
    }

    const officer = await prisma.user.findUnique({ where: { id: officerId } });
    if (!officer || officer.roleName !== UserRole.REVENUE_OFFICER) {
      throw new BadRequestError(`User ${officerId} is not a valid Revenue Officer`);
    }

    const updated = await prisma.request.update({
      where: { id: requestId },
      data: { assignedOfficerId: officerId },
      include: { assignedOfficer: true },
    });

    await prisma.auditLog.create({
      data: {
        actorId: adminId,
        actorRole: UserRole.ADMIN,
        action: AuditAction.UPDATE,
        entityType: 'RequestOfficerAssignment',
        entityId: requestId,
        snapshotDiffJson: JSON.stringify({
          applicationNumber: request.applicationNumber,
          previousOfficerId: request.assignedOfficerId,
          assignedOfficerName: officer.fullName,
          assignedOfficerId: officerId,
        }),
      },
    });

    return updated;
  }

  static async updateRequestStage(
    requestId: string,
    stage: RequestStage,
    reason: string | undefined,
    adminId: string
  ) {
    const request = await prisma.request.findUnique({ where: { id: requestId } });
    if (!request) {
      throw new NotFoundError(`Request ${requestId} not found`);
    }

    const updated = await prisma.request.update({
      where: { id: requestId },
      data: {
        stage,
        rejectionReason: reason ?? request.rejectionReason,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: adminId,
        actorRole: UserRole.ADMIN,
        action: AuditAction.UPDATE,
        entityType: 'RequestStageOverride',
        entityId: requestId,
        snapshotDiffJson: JSON.stringify({
          applicationNumber: request.applicationNumber,
          previousStage: request.stage,
          newStage: stage,
          reason,
        }),
      },
    });

    return updated;
  }

  /**
   * 6. Validation Monitoring
   */
  static async getValidationMetrics(): Promise<ValidationMetricsDTO> {
    const [
      totalValidations,
      passedValidations,
      unresolvedIssuesCount,
      criticalIssuesCount,
      warningIssuesCount,
      infoIssuesCount,
      allIssues,
      avgScoreResult,
    ] = await Promise.all([
      prisma.validationResult.count(),
      prisma.validationResult.count({ where: { isValid: true } }),
      prisma.validationIssue.count({ where: { isResolved: false } }),
      prisma.validationIssue.count({ where: { isResolved: false, severity: 'CRITICAL' } }),
      prisma.validationIssue.count({ where: { isResolved: false, severity: 'WARNING' } }),
      prisma.validationIssue.count({ where: { isResolved: false, severity: 'INFO' } }),
      prisma.validationIssue.findMany({ select: { ruleCode: true } }),
      prisma.validationResult.aggregate({ _avg: { overallScore: true } }),
    ]);

    const failedValidations = totalValidations - passedValidations;
    const passRatePercentage =
      totalValidations > 0 ? parseFloat(((passedValidations / totalValidations) * 100).toFixed(1)) : 100;

    // Calculate top triggered rule frequencies
    const ruleFrequencyMap: Record<string, number> = {};
    for (const issue of allIssues) {
      ruleFrequencyMap[issue.ruleCode] = (ruleFrequencyMap[issue.ruleCode] || 0) + 1;
    }

    const topTriggeredRules = Object.entries(ruleFrequencyMap)
      .map(([ruleCode, count]) => ({ ruleCode, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    return {
      totalValidations,
      passedValidations,
      failedValidations,
      passRatePercentage,
      averageScore: parseFloat((avgScoreResult._avg.overallScore || 0).toFixed(1)),
      unresolvedIssuesCount,
      criticalIssuesCount,
      warningIssuesCount,
      infoIssuesCount,
      topTriggeredRules,
    };
  }

  static async getValidationIssues(options: {
    severity?: string;
    ruleCode?: string;
    isResolved?: boolean;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (options.severity) where.severity = options.severity;
    if (options.ruleCode) where.ruleCode = options.ruleCode;
    if (options.isResolved !== undefined) where.isResolved = options.isResolved;

    const [total, issues] = await Promise.all([
      prisma.validationIssue.count({ where }),
      prisma.validationIssue.findMany({
        where,
        skip,
        take: limit,
        include: {
          validationResult: {
            include: {
              landRecord: {
                include: { location: true, owners: true },
              },
            },
          },
        },
        orderBy: [{ severity: 'asc' }, { validationResult: { createdAt: 'desc' } }],
      }),
    ]);

    return {
      issues: issues.map((i) => ({
        id: i.id,
        ruleCode: i.ruleCode,
        severity: i.severity,
        title: i.title,
        description: i.description,
        isResolved: i.isResolved,
        resolvedAt: i.resolvedAt?.toISOString() || null,
        record: i.validationResult?.landRecord
          ? {
              id: i.validationResult.landRecord.id,
              ulpin: i.validationResult.landRecord.ulpin,
              khasraNumber: i.validationResult.landRecord.khasraNumber,
              village: i.validationResult.landRecord.location?.village,
              district: i.validationResult.landRecord.location?.district,
            }
          : null,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * 7. Audit Trail - Server-side paginated & multi-filtered
   */
  static async getAuditLogs(options: {
    action?: string;
    entityType?: string;
    actorId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 25));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (options.action) where.action = options.action;
    if (options.entityType) where.entityType = options.entityType;
    if (options.actorId) where.actorId = options.actorId;

    if (options.search && options.search.trim()) {
      const q = options.search.trim();
      where.OR = [
        { entityId: { contains: q } },
        { entityType: { contains: q } },
        { actor: { fullName: { contains: q } } },
        { actor: { email: { contains: q } } },
      ];
    }

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        include: {
          actor: {
            select: { id: true, fullName: true, email: true, roleName: true },
          },
        },
        orderBy: { timestamp: 'desc' },
      }),
    ]);

    return {
      logs: logs.map((l) => {
        let snapshotDiff = null;
        if (l.snapshotDiffJson) {
          try {
            snapshotDiff =
              typeof l.snapshotDiffJson === 'string'
                ? JSON.parse(l.snapshotDiffJson)
                : l.snapshotDiffJson;
          } catch {
            snapshotDiff = l.snapshotDiffJson;
          }
        }

        return {
          id: l.id,
          actorId: l.actorId,
          actorRole: l.actorRole,
          action: l.action,
          entityType: l.entityType,
          entityId: l.entityId,
          ipAddress: l.ipAddress || '127.0.0.1',
          snapshotDiff,
          timestamp: l.timestamp.toISOString(),
          actor: l.actor || {
            fullName: 'System Engine',
            email: 'system@bhoomisetu.gov.in',
            roleName: l.actorRole,
          },
        };
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }
}
