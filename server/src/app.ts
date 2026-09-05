import express, { Express } from 'express';
import cors from 'cors';
import path from 'path';
import { env } from './config/env';
import apiRouter from './routes';
import { errorHandler } from './middleware/error.middleware';
import { NotFoundError } from './utils/AppError';

export function createApp(): Express {
  const app = express();

  // Standard Middlewares
  app.use(
    cors({
      origin: env.CLIENT_URL || '*',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Static uploads directory (for previewing documents)
  app.use('/uploads', express.static(path.resolve(env.UPLOAD_DIR)));

  // Mount API v1 Routes
  app.use('/api/v1', apiRouter);

  // Handle 404 for unknown API endpoints
  app.use('*', (req, res, next) => {
    next(new NotFoundError(`Route ${req.originalUrl} not found on this server`));
  });

  // Centralized Error Handling Middleware
  app.use(errorHandler);

  return app;
}
