import { createApp } from './app';
import { env } from './config/env';

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`
  🌐 Intelligent Land Record Digitization API Server
  🚀 Status: Running in ${env.NODE_ENV} mode
  📡 URL: http://localhost:${env.PORT}/api/v1
  🩺 Health check: http://localhost:${env.PORT}/api/v1/health
  `);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});
