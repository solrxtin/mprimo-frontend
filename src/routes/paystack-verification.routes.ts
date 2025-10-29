
import { Router } from 'express';
import * as paystackVerificationController from './paystack-verification.controller';
import { verifyToken } from '../middlewares/verify-token.middleware';

const router = Router();

router.get('/supported-countries', paystackVerificationController.getSupportedCountries);
router.get('/banks', paystackVerificationController.getBankList);
router.post('/resolve-account', paystackVerificationController.resolveAccount);
router.post('/resolve-bvn', paystackVerificationController.resolveBvn);
router.post('/create-subaccount', verifyToken, paystackVerificationController.createSubaccount);

export default router;
