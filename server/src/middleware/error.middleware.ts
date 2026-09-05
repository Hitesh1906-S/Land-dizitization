import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { sendError } from '../utils/responseFormatter';
import { HTTP_STATUS, ERROR_CODES } from '../constants';
import { env } from '../config/env';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) {
  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode, err.errorCode, err.details);
  }

  // Handle Prisma Known Errors
  if (err.code === 'P2002') {
    return sendError(
      res,
      'A unique constraint violation occurred (duplicate record)',
      HTTP_STATUS.CONFLICT,
      ERROR_CODES.CONFLICT,
      { fields: err.meta?.target }
    );
  }

  if (err.code === 'P2025') {
    return sendError(
      res,
      'The requested record was not found in database',
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.NOT_FOUND
    );
  }

  // Handle Multer upload errors
  if (err.name === 'MulterError') {
    return sendError(
      res,
      `File upload error: ${err.message}`,
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  console.error('💥 Unhandled Exception:', err);

  const message = env.NODE_ENV === 'production' ? 'An unexpected internal error occurred' : err.message;
  const details = env.NODE_ENV === 'production' ? undefined : err.stack;

  return sendError(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODES.INTERNAL_ERROR, details);
}
