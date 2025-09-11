import { Router } from 'express';
import { verifyToken } from '../middlewares/verify-token.middleware';
import {
  createCryptoWallet,
  getBalance,
  getUserWallet,
  getPaymentAddress,
  verifyPayment,
  processApplePayPayment,
  createApplePaySession,
  createPaymentIntent,
  processStripePayment,
} from '../controllers/payment.controller';
import { StripeWebhookController } from '../controllers/stripe-webhook.controller';

const router = Router();

// Crypto payment routes
router.post('/wallet/create', verifyToken, createCryptoWallet);
router.post('/balance', verifyToken, getBalance);
router.get('/wallet', verifyToken, getUserWallet);
router.get('/address/:orderId', verifyToken, getPaymentAddress);
router.post('/verify', verifyToken, verifyPayment);

// Stripe routes
router.post('/stripe/intent', verifyToken, createPaymentIntent);
router.post('/stripe/process', verifyToken, processStripePayment);
router.post('/stripe/webhook', StripeWebhookController.handleWebhook);

// Apple Pay routes
router.post('/apple-pay/process', verifyToken, processApplePayPayment);
router.post('/apple-pay/session', createApplePaySession);

export default router;