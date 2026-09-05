import express, { Express } from 'express';
import cors from 'cors';
import { env } from './config/env';
import apiRouter from './routes';
import { errorHandler } from './middleware/error.middleware';
import { securityHeaders } from './middleware/securityHeaders.middleware';
import { apiRateLimiter } from './middleware/rateLimiter.middleware';
import { NotFoundError } from './utils/AppError';

export function createApp(): Express {
  const app = express();

  // 1. Security Headers (HSTS, X-Content-Type-Options, X-Frame-Options, etc.)
  app.use(securityHeaders);

  // 2. CORS Hardening
  app.use(
    cors({
      origin: env.CLIENT_URL || '*',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  // 3. Body parsers with safe payload limits
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 4. General API Rate Limiter
  app.use(apiRateLimiter);

  // 5. Mount API v1 Routes
  app.use('/api/v1', apiRouter);

  // 6. Handle 404 for unknown API endpoints
  app.use('*', (req, res, next) => {
    next(new NotFoundError(`Route ${req.originalUrl} not found on this server`));
  });

  // 7. Centralized Error Handling Middleware
  app.use(errorHandler);

  return app;
}

