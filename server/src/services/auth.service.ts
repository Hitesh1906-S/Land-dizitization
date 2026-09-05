import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { hashPassword, comparePassword } from '../utils/hash';
import { BadRequestError, UnauthorizedError, NotFoundError } from '../utils/AppError';
import { UserRole, AuthResponse, UserDTO, AuditAction } from '@land-digitization/shared';

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
    const roleName = data.role || UserRole.CITIZEN;

    // Find roleId if exists
    const roleRecord = await prisma.role.findUnique({
      where: { name: roleName },
    });

    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase().trim(),
        passwordHash,
        fullName: data.fullName.trim(),
        phone: data.phone,
        roleId: roleRecord ? roleRecord.id : undefined,
        roleName,
        jurisdictionDistrict: data.jurisdictionDistrict,
        jurisdictionTehsil: data.jurisdictionTehsil,
        isActive: true,
      },
    });

    // Record Registration Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          actorId: user.id,
          actorRole: user.roleName,
          action: AuditAction.CREATE,
          entityType: 'User',
          entityId: user.id,
          snapshotDiffJson: JSON.stringify({ email: user.email, role: user.roleName }),
        },
      });
    } catch {
      // Non-blocking audit log creation
    }

    const token = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return {
      user: this.mapToUserDTO(user),
      token,
      refreshToken,
    };
  }

  static async login(email: string, password: string, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account has been deactivated. Please contact administrator.');
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Record Login Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          actorId: user.id,
          actorRole: user.roleName,
          action: AuditAction.VERIFY,
          entityType: 'Session',
          entityId: user.id,
          ipAddress,
          userAgent,
          snapshotDiffJson: JSON.stringify({ event: 'USER_LOGIN_SUCCESS', email: user.email }),
        },
      });
    } catch {
      // Non-blocking audit log
    }

    const token = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return {
      user: this.mapToUserDTO(user),
      token,
      refreshToken,
    };
  }

  static async getProfile(userId: string): Promise<UserDTO> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User account not found');
    }

    return this.mapToUserDTO(user);
  }

  static async refresh(refreshToken: string): Promise<{ token: string }> {
    try {
      const decoded = jwt.verify(refreshToken, env.REFRESH_TOKEN_SECRET) as any;
      const user = await prisma.user.findUnique({ where: { id: decoded.id } });

      if (!user || !user.isActive) {
        throw new UnauthorizedError('User does not exist or is inactive');
      }

      const token = this.generateAccessToken(user);
      return { token };
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
  }

  static generateAccessToken(user: { id: string; email: string; roleName: string; jurisdictionDistrict?: string | null; jurisdictionTehsil?: string | null }): string {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.roleName,
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
      phone: user.phone || undefined,
      role: (user.roleName || user.role || UserRole.CITIZEN) as UserRole,
      jurisdictionDistrict: user.jurisdictionDistrict || undefined,
      jurisdictionTehsil: user.jurisdictionTehsil || undefined,
      isActive: user.isActive ?? true,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
