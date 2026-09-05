import { Router } from 'express';
import { DocumentController } from '../controllers/document.controller';
import { authenticate } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

router.post('/upload', authenticate, upload.single('file'), DocumentController.upload);
router.get('/:id', authenticate, DocumentController.getById);
router.get('/:id/download', authenticate, DocumentController.downloadFile);

export default router;
