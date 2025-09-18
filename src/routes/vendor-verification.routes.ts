import { Router } from 'express';
import { verifyToken } from '../middlewares/verify-token.middleware';
import { initiateStripeVerification, checkStripeVerificationStatus, getVerificationRequirements } from '../controllers/vendor-verification.controller';
import { createVendorPayout, getVendorPayoutHistory } from '../controllers/vendor-payout.controller';

const router = Router();

router.post('/stripe/initiate', verifyToken, initiateStripeVerification);
router.get('/stripe/status', verifyToken, checkStripeVerificationStatus);
router.get('/stripe/requirements', verifyToken, getVerificationRequirements);

// Admin payout routes
router.post('/payout', verifyToken, createVendorPayout);
router.get('/payout/:vendorId', verifyToken, getVendorPayoutHistory);

export default router;