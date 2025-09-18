import { Router } from 'express';
import { verifyToken } from '../middlewares/verify-token.middleware';
import { initiateVerification, checkVerificationStatus } from '../controllers/stripe-verification.controller';

const router = Router();

router.post('/initiate', verifyToken, initiateVerification);
router.get('/status', verifyToken, checkVerificationStatus);

export default router;