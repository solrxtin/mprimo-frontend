import { Router } from 'express';
import { verifyToken } from '../middlewares/verify-token.middleware';
import { 
  getSupportedCountries,
  getCountryDetails,
  initiateStripeVerification, 
  checkStripeVerificationStatus, 
  getVerificationRequirements,
  getUploadRequirements,
  uploadDocument,
  updatePersonalInfo,
  updateBusinessInfo,
  updateBankDetails,
  submitDocuments,
  acceptTos,
  handleStripeWebhook
} from '../controllers/vendor-verification.controller';
import { getVendorPayouts } from '../controllers/vendor-payout.controller';

const router = Router();

router.get('/supported-countries', getSupportedCountries);
router.get('/country/:countryCode', getCountryDetails);
router.post('/stripe/initiate', verifyToken, initiateStripeVerification);
router.get('/stripe/status', verifyToken, checkStripeVerificationStatus);
router.get('/stripe/requirements', getVerificationRequirements);

// Embedded verification routes
router.get('/upload-requirements', verifyToken, getUploadRequirements);
router.post('/upload-document', verifyToken, uploadDocument);
router.post('/update-personal-info', verifyToken, updatePersonalInfo);
router.post('/update-business-info', verifyToken, updateBusinessInfo);
router.post('/update-bank-details', verifyToken, updateBankDetails);
router.post('/submit-documents', verifyToken, submitDocuments);
router.post('/accept-tos', verifyToken, acceptTos);

// Stripe webhook (no auth required)
router.post('/stripe/webhook', handleStripeWebhook);

// Admin payout routes
// router.post('/payout', verifyToken, createVendorPayout);
// router.get('/payout/:vendorId', verifyToken, getVendorPayouts);

export default router;