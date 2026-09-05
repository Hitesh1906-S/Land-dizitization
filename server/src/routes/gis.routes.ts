import { Router } from 'express';
import { GisController } from '../controllers/gis.controller';
import { optionalAuthenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/parcels', optionalAuthenticate, GisController.getVillageParcels);
router.post('/compute-geometry', optionalAuthenticate, GisController.computeGeometry);

export default router;
