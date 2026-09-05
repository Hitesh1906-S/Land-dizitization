import { prisma } from '../config/database';
import { NotFoundError } from '../utils/AppError';
import { WorkflowStage, WorkflowType, MutationRequestDTO } from '@land-digitization/shared';

export class WorkflowService {
  static async submitRequest(data: {
    applicantId: string;
    recordId?: string;
    requestType: WorkflowType;
    metadata?: Record<string, any>;
    documentIds?: string[];
  }) {
    const applicationNo = `MUT-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const request = await prisma.mutationRequest.create({
      data: {
        applicationNo,
        applicantId: data.applicantId,
        recordId: data.recordId,
        requestType: data.requestType,
        stage: WorkflowStage.SUBMITTED,
        metadataJson: data.metadata ? JSON.stringify(data.metadata) : null,
        documents: data.documentIds
          ? {
              connect: data.documentIds.map((id) => ({ id })),
            }
          : undefined,
      },
      include: {
        applicant: true,
        record: true,
        documents: true,
      },
    });

    return this.mapToDTO(request);
  }

  static async updateStage(requestId: string, officerId: string, stage: WorkflowStage, rejectionReason?: string) {
    const request = await prisma.mutationRequest.findUnique({ where: { id: requestId } });
    if (!request) {
      throw new NotFoundError(`Mutation request with ID ${requestId} not found`);
    }

    const updated = await prisma.mutationRequest.update({
      where: { id: requestId },
      data: {
        stage,
        assignedOfficerId: officerId,
        rejectionReason: stage === WorkflowStage.REJECTED ? rejectionReason : null,
      },
      include: {
        applicant: true,
        record: true,
        documents: true,
      },
    });

    return this.mapToDTO(updated);
  }

  static async getRequests(filters: { applicantId?: string; officerId?: string; stage?: WorkflowStage }) {
    const where: any = {};
    if (filters.applicantId) where.applicantId = filters.applicantId;
    if (filters.officerId) where.assignedOfficerId = filters.officerId;
    if (filters.stage) where.stage = filters.stage;

    const requests = await prisma.mutationRequest.findMany({
      where,
      include: {
        applicant: true,
        record: true,
        documents: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return requests.map(this.mapToDTO);
  }

  static mapToDTO(req: any): MutationRequestDTO {
    return {
      id: req.id,
      applicationNo: req.applicationNo,
      recordId: req.recordId,
      applicantId: req.applicantId,
      requestType: req.requestType as WorkflowType,
      stage: req.stage as WorkflowStage,
      assignedOfficerId: req.assignedOfficerId,
      rejectionReason: req.rejectionReason,
      metadata: req.metadataJson,
      applicant: req.applicant,
      record: req.record,
      documents: req.documents,
      createdAt: req.createdAt.toISOString(),
      updatedAt: req.updatedAt.toISOString(),
    };
  }
}
