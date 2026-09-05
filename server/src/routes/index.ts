import { Router } from 'express';
import authRoutes from './auth.routes';
import recordRoutes from './record.routes';
import locationRoutes from './location.routes';
import documentRoutes from './document.routes';
import ocrRoutes from './ocr.routes';
import validationRoutes from './validation.routes';
import conflictRoutes from './conflict.routes';
import gisRoutes from './gis.routes';
import workflowRoutes from './workflow.routes';
import auditRoutes from './audit.routes';
import officerRoutes from './officer.routes';
import adminRoutes from './admin.routes';
import { sendSuccess } from '../utils/responseFormatter';

const router = Router();

// Healthcheck Route
router.get('/health', (req, res) => {
  return sendSuccess(res, {
    status: 'UP',
    system: 'Intelligent Land Record Digitization and Validation API (BhoomiSetu)',
    version: '1.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  }, 'API is operational');
});

// Register Domain Route Endpoints
router.use('/auth', authRoutes);
router.use('/locations', locationRoutes);
router.use('/records', recordRoutes);
router.use('/documents', documentRoutes);
router.use('/ocr', ocrRoutes);
router.use('/validation', validationRoutes);
router.use('/conflicts', conflictRoutes);
router.use('/gis', gisRoutes);
router.use('/workflows', workflowRoutes);
router.use('/requests', workflowRoutes);
router.use('/audit', auditRoutes);
router.use('/officer', officerRoutes);
router.use('/admin', adminRoutes);

export default router;


