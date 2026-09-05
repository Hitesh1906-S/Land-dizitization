import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { sendSuccess } from '../utils/responseFormatter';
import { HTTP_STATUS } from '../constants';
import { BadRequestError } from '../utils/AppError';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, fullName, phone, role, jurisdictionDistrict, jurisdictionTehsil } = req.body;
      if (!email || !password || !fullName) {
        throw new BadRequestError('Email, password, and full name are required');
      }

      const result = await AuthService.register({
        email,
        password,
        fullName,
        phone,
        role,
        jurisdictionDistrict,
        jurisdictionTehsil,
      });

      return sendSuccess(res, result, 'Registration successful', HTTP_STATUS.CREATED);
    } catch (err) {
      next(err);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        throw new BadRequestError('Email and password are required');
      }

      const result = await AuthService.login(email, password);
      return sendSuccess(res, result, 'Login successful');
    } catch (err) {
      next(err);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        throw new BadRequestError('Refresh token is required');
      }

      const result = await AuthService.refresh(refreshToken);
      return sendSuccess(res, result, 'Token refreshed');
    } catch (err) {
      next(err);
    }
  }

  static async me(req: Request, res: Response, next: NextFunction) {
    try {
      return sendSuccess(res, req.user, 'Profile retrieved');
    } catch (err) {
      next(err);
    }
  }
}
