import { prisma } from '../config/database';
import { NotFoundError } from '../utils/AppError';
import { WorkflowStage, WorkflowType, RequestDTO } from '@land-digitization/shared';

export class WorkflowService {
  static async submitRequest(data: {
    applicantId: string;
    landRecordId?: string;
    requestType: WorkflowType;
    metadata?: Record<string, any>;
    documentIds?: string[];
  }): Promise<RequestDTO> {
    const prefix = data.requestType === WorkflowType.NEW_DIGITIZATION ? 'DIG' : 'MUT';
    const applicationNumber = `${prefix}-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const request = await prisma.request.create({
      data: {
        applicationNumber,
        applicantId: data.applicantId,
        landRecordId: data.landRecordId,
        requestType: data.requestType,
        stage: WorkflowStage.SUBMITTED,
        metadataJson: data.metadata ? JSON.stringify(data.metadata) : null,
      },
      include: {
        applicant: true,
        landRecord: {
          include: { location: true },
        },
        documents: true,
      },
    });

    if (data.documentIds && data.documentIds.length > 0) {
      await prisma.document.updateMany({
        where: { id: { in: data.documentIds } },
        data: { requestId: request.id },
      });
    }

    // Write audit log
    await prisma.auditLog.create({
      data: {
        actorId: data.applicantId,
        actorRole: 'CITIZEN',
        action: 'CREATE',
        entityType: 'Request',
        entityId: request.id,
        snapshotDiffJson: JSON.stringify({
          applicationNumber,
          requestType: data.requestType,
          stage: WorkflowStage.SUBMITTED,
        }),
      },
    });

    return this.getRequestById(request.id);
  }

  static async updateStage(requestId: string, officerId: string, stage: WorkflowStage, rejectionReason?: string): Promise<RequestDTO> {
    const request = await prisma.request.findUnique({ where: { id: requestId } });
    if (!request) {
      throw new NotFoundError(`Request with ID ${requestId} not found`);
    }

    const previousStage = request.stage;

    await prisma.request.update({
      where: { id: requestId },
      data: {
        stage,
        assignedOfficerId: officerId,
        rejectionReason: (stage === WorkflowStage.REJECTED || stage === WorkflowStage.NEEDS_CORRECTION) ? rejectionReason : null,
      },
    });

    // Write audit log for stage progression
    await prisma.auditLog.create({
      data: {
        actorId: officerId,
        actorRole: 'REVENUE_OFFICER',
        action: stage === WorkflowStage.VERIFIED ? 'APPROVE_MUTATION' : stage === WorkflowStage.REJECTED ? 'REJECT_MUTATION' : 'UPDATE',
        entityType: 'Request',
        entityId: requestId,
        snapshotDiffJson: JSON.stringify({
          previousStage,
          newStage: stage,
          rejectionReason,
        }),
      },
    });

    return this.getRequestById(requestId);
  }

  static async getRequestById(idOrAppNo: string): Promise<RequestDTO> {
    let req = await prisma.request.findUnique({
      where: { id: idOrAppNo },
      include: {
        applicant: true,
        assignedOfficer: true,
        landRecord: {
          include: { location: true, owners: true },
        },
        documents: true,
      },
    });

    if (!req) {
      req = await prisma.request.findUnique({
        where: { applicationNumber: idOrAppNo },
        include: {
          applicant: true,
          assignedOfficer: true,
          landRecord: {
            include: { location: true, owners: true },
          },
          documents: true,
        },
      });
    }

    if (!req) {
      throw new NotFoundError(`Request with identifier '${idOrAppNo}' not found`);
    }

    return this.mapToDTO(req);
  }

  static async getRequests(filters: { applicantId?: string; officerId?: string; stage?: WorkflowStage }): Promise<RequestDTO[]> {
    const requests = await prisma.request.findMany({
      where: {
        ...(filters.applicantId && { applicantId: filters.applicantId }),
        ...(filters.officerId && { assignedOfficerId: filters.officerId }),
        ...(filters.stage && { stage: filters.stage }),
      },
      include: {
        applicant: true,
        assignedOfficer: true,
        landRecord: {
          include: { location: true },
        },
        documents: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return requests.map(r => this.mapToDTO(r));
  }

  static mapToDTO(req: any): RequestDTO {
    return {
      id: req.id,
      applicationNumber: req.applicationNumber,
      landRecordId: req.landRecordId || undefined,
      applicantId: req.applicantId,
      requestType: req.requestType as WorkflowType,
      stage: req.stage as WorkflowStage,
      assignedOfficerId: req.assignedOfficerId || undefined,
      rejectionReason: req.rejectionReason || undefined,
      metadataJson: req.metadataJson || undefined,
      createdAt: req.createdAt.toISOString(),
      updatedAt: req.updatedAt.toISOString(),
      applicant: req.applicant ? {
        id: req.applicant.id,
        email: req.applicant.email,
        fullName: req.applicant.fullName,
        phone: req.applicant.phone || undefined,
        role: req.applicant.roleName as any,
        isActive: req.applicant.isActive ?? true,
        createdAt: req.applicant.createdAt.toISOString(),
        updatedAt: req.applicant.updatedAt.toISOString(),
      } : undefined,
      assignedOfficer: req.assignedOfficer ? {
        id: req.assignedOfficer.id,
        email: req.assignedOfficer.email,
        fullName: req.assignedOfficer.fullName,
        phone: req.assignedOfficer.phone || undefined,
        role: req.assignedOfficer.roleName as any,
        isActive: req.assignedOfficer.isActive ?? true,
        createdAt: req.assignedOfficer.createdAt.toISOString(),
        updatedAt: req.assignedOfficer.updatedAt.toISOString(),
      } : undefined,
      landRecord: req.landRecord ? {
        id: req.landRecord.id,
        ulpin: req.landRecord.ulpin,
        khasraNumber: req.landRecord.khasraNumber,
        khatauniNumber: req.landRecord.khatauniNumber,
        locationId: req.landRecord.locationId,
        areaInSqMeters: req.landRecord.areaInSqMeters,
        areaUnit: req.landRecord.areaUnit,
        landType: req.landRecord.landType,
        status: req.landRecord.status,
        createdById: req.landRecord.createdById,
        createdAt: req.landRecord.createdAt.toISOString(),
        updatedAt: req.landRecord.updatedAt.toISOString(),
      } : undefined,
      documents: req.documents ? req.documents.map((d: any) => ({
        id: d.id,
        landRecordId: d.landRecordId || undefined,
        requestId: d.requestId || undefined,
        fileName: d.fileName,
        fileType: d.fileType,
        filePath: d.filePath,
        fileSize: d.fileSize,
        fileHash: d.fileHash,
        documentType: d.documentType as any,
        uploadedById: d.uploadedById,
        createdAt: d.createdAt.toISOString(),
      })) : [],
    };
  }
}
