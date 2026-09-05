import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { hashPassword, comparePassword } from '../utils/hash';
import { BadRequestError, UnauthorizedError } from '../utils/AppError';
import { UserRole } from '../constants';
import { AuthResponse, UserDTO } from '@land-digitization/shared';

export class AuthService {
  static async register(data: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    role?: UserRole;
    jurisdictionDistrict?: string;
    jurisdictionTehsil?: string;
  }): Promise<AuthResponse> {
    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase().trim() },
    });

    if (existing) {
      throw new BadRequestError('An account with this email address already exists');
    }

    const passwordHash = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase().trim(),
        passwordHash,
        fullName: data.fullName.trim(),
        phone: data.phone,
        role: data.role || UserRole.CITIZEN,
        jurisdictionDistrict: data.jurisdictionDistrict,
        jurisdictionTehsil: data.jurisdictionTehsil,
      },
    });

    const token = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return {
      user: this.mapToUserDTO(user),
      token,
      refreshToken,
    };
  }

  static async login(email: string, password: string): Promise<AuthResponse> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const token = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return {
      user: this.mapToUserDTO(user),
      token,
      refreshToken,
    };
  }

  static async refresh(refreshToken: string): Promise<{ token: string }> {
    try {
      const decoded = jwt.verify(refreshToken, env.REFRESH_TOKEN_SECRET) as any;
      const user = await prisma.user.findUnique({ where: { id: decoded.id } });

      if (!user) {
        throw new UnauthorizedError('User does not exist');
      }

      const token = this.generateAccessToken(user);
      return { token };
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
  }

  static generateAccessToken(user: { id: string; email: string; role: string; jurisdictionDistrict?: string | null; jurisdictionTehsil?: string | null }): string {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        jurisdictionDistrict: user.jurisdictionDistrict,
        jurisdictionTehsil: user.jurisdictionTehsil,
      },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as any }
    );
  }

  static generateRefreshToken(user: { id: string }): string {
    return jwt.sign({ id: user.id }, env.REFRESH_TOKEN_SECRET, {
      expiresIn: env.REFRESH_TOKEN_EXPIRES_IN as any,
    });
  }

  static mapToUserDTO(user: any): UserDTO {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role as UserRole,
      jurisdictionDistrict: user.jurisdictionDistrict,
      jurisdictionTehsil: user.jurisdictionTehsil,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
