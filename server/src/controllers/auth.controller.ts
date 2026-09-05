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

      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const result = await AuthService.login(email, password, ipAddress, userAgent);
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
      if (!req.user) {
        throw new BadRequestError('No user session active');
      }

      const profile = await AuthService.getProfile(req.user.id);
      return sendSuccess(res, profile, 'Profile retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      // Client destroys token; endpoint responds with success confirmation
      return sendSuccess(res, { loggedOut: true }, 'Logged out successfully');
    } catch (err) {
      next(err);
    }
  }
}
