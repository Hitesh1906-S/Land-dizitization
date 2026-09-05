import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { BadRequestError } from '../utils/AppError';

export type ValidationConfig =
  | ZodSchema<any>
  | {
      body?: ZodSchema<any>;
      query?: ZodSchema<any>;
      params?: ZodSchema<any>;
    };

export function validateRequest(schema: ValidationConfig) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if ('parse' in schema) {
        // Direct ZodSchema -> validate req.body
        req.body = schema.parse(req.body);
      } else {
        if (schema.body) {
          req.body = schema.body.parse(req.body);
        }
        if (schema.query) {
          req.query = schema.query.parse(req.query);
        }
        if (schema.params) {
          req.params = schema.params.parse(req.params);
        }
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        }));
        next(new BadRequestError('Request validation failed', issues));
      } else {
        next(error);
      }
    }
  };
}
