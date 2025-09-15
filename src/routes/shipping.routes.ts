import { Router } from 'express';
import {
  getShippingPrice,
  createShipment,
  trackShipment,
  getLocalStations,
  getInternationalStations,
  getServiceCentres,
  getDropOffPrice,
  createDropOffShipment,
  determineShipmentType,
} from '../controllers/shipping.controller';
import { verifyToken } from '../middlewares/verify-token.middleware';


const router = Router();

// Pricing endpoints
router.post('/price', verifyToken, getShippingPrice);
router.post('/dropoff/price', verifyToken, getDropOffPrice);

// Shipment creation
router.post('/create', verifyToken, createShipment);
router.post('/dropoff/create', verifyToken, createDropOffShipment);

// Tracking
router.get('/track/:waybill', verifyToken, trackShipment);

// Stations
router.get('/stations/local', verifyToken, getLocalStations);
router.get('/stations/international', verifyToken, getInternationalStations);
router.get('/stations/:stationId/centres', verifyToken, getServiceCentres);

// Utility
router.post('/determine-type', verifyToken, determineShipmentType);

export default router;