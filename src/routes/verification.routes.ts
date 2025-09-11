import { Router } from 'express';
import { VerificationController } from '../controllers/verification.controller';
import { WebhookController } from '../controllers/webhook.controller';
import { verifyToken } from '../middlewares/verify-token.middleware';
import { authorizeRole } from '../middlewares/authorize-role.middleware';
import { uploadDocument } from '../config/multer.config';

const router = Router();

// Public webhooks (no auth required)
router.post('/webhooks/kyc-result', WebhookController.handleKYCResult);
router.post('/webhooks/aml-result', WebhookController.handleAMLResult);

// Protected routes
router.use(verifyToken);

// Vendor application submission
router.post('/apply', VerificationController.submitApplication);

// Document upload
router.post('/:verificationId/documents', 
  uploadDocument, 
  VerificationController.uploadDocument
);

// Get verification status
router.get('/:verificationId/status', VerificationController.getVerificationStatus);

// Account upgrade
router.post('/upgrade', VerificationController.upgradeAccount);

// Admin only routes
router.patch('/:verificationId/review', 
  authorizeRole(['admin']), 
  VerificationController.manualReview
);

export default router;