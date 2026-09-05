import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../constants';
import { ForbiddenError, UnauthorizedError } from '../utils/AppError';

export function authorize(roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('User is not authenticated'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ForbiddenError(`Access forbidden: Requires one of [${roles.join(', ')}] role`)
      );
    }

    next();
  };
}

export function enforceJurisdiction(getDistrictAndTehsil: (req: Request) => { district?: string; tehsil?: string }) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }

    // Admins bypass jurisdiction check
    if (req.user.role === UserRole.ADMIN) {
      return next();
    }

    // Revenue officers must match jurisdiction if assigned
    if (req.user.role === UserRole.REVENUE_OFFICER) {
      const { district, tehsil } = getDistrictAndTehsil(req);

      if (req.user.jurisdictionDistrict && district && req.user.jurisdictionDistrict !== district) {
        return next(new ForbiddenError('Operation outside officer assigned district jurisdiction'));
      }

      if (req.user.jurisdictionTehsil && tehsil && req.user.jurisdictionTehsil !== tehsil) {
        return next(new ForbiddenError('Operation outside officer assigned tehsil jurisdiction'));
      }
    }

    next();
  };
}
