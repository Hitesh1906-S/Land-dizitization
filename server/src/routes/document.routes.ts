import { Router } from 'express';
import { DocumentController } from '../controllers/document.controller';
import { authenticate } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

router.get('/', authenticate, DocumentController.list);
router.post('/upload', authenticate, upload.single('file'), DocumentController.upload);
router.get('/:id', authenticate, DocumentController.getById);
router.get('/:id/view', authenticate, DocumentController.viewFile);
router.get('/:id/download', authenticate, DocumentController.downloadFile);
router.delete('/:id', authenticate, DocumentController.delete);

export default router;
