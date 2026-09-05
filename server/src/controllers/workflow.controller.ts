import { Request, Response, NextFunction } from 'express';
import { WorkflowService } from '../services/workflow.service';
import { sendSuccess } from '../utils/responseFormatter';
import { HTTP_STATUS, UserRole } from '../constants';
import { BadRequestError, ForbiddenError } from '../utils/AppError';

export class WorkflowController {
  static async submit(req: Request, res: Response, next: NextFunction) {
    try {
      const { landRecordId, requestType, metadata, documentIds } = req.body;
      if (!requestType) {
        throw new BadRequestError('requestType is required');
      }

      const request = await WorkflowService.submitRequest({
        applicantId: req.user!.id,
        landRecordId,
        requestType,
        metadata,
        documentIds,
      });

      return sendSuccess(res, request, 'Application submitted successfully', HTTP_STATUS.CREATED);
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const request = await WorkflowService.getRequestById(req.params.id);

      // Strict ownership check: Citizens can only access their own applications
      if (req.user!.role === UserRole.CITIZEN && request.applicantId !== req.user!.id) {
        throw new ForbiddenError('Access forbidden: You can only view your own application requests');
      }

      return sendSuccess(res, request, 'Request retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async updateStage(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { stage, rejectionReason } = req.body;
      if (!stage) {
        throw new BadRequestError('stage is required');
      }

      const updated = await WorkflowService.updateStage(id, req.user!.id, stage, rejectionReason);
      return sendSuccess(res, updated, 'Application stage updated');
    } catch (err) {
      next(err);
    }
  }

  static async getRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const { stage } = req.query;
      const applicantId = req.user!.role === UserRole.CITIZEN ? req.user!.id : undefined;

      const requests = await WorkflowService.getRequests({
        applicantId,
        stage: stage as any,
      });

      return sendSuccess(res, requests, 'Requests retrieved');
    } catch (err) {
      next(err);
    }
  }
}
