import { Router } from 'express';
import { GisController } from '../controllers/gis.controller.js';
import { optionalAuthenticate } from '../middleware/auth.middleware.js';

const router = Router();

// Retrieve Cadastral parcels GeoJSON with search, location, and validation status filters
router.get('/parcels', optionalAuthenticate, GisController.getVillageParcels);

// Retrieve single parcel details
router.get('/parcels/:id', optionalAuthenticate, GisController.getParcelById);

// Compute geometry centroid and area with Turf.js
router.post('/compute-geometry', optionalAuthenticate, GisController.computeGeometry);

export default router;
