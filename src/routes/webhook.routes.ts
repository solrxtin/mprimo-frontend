import express from 'express';
import { StripeWebhookController } from '../controllers/stripe-webhook.controller';


const router = express.Router();

// Stripe requires raw body parsing for signature verification
router.post(
  '/stripe',
  express.raw({ type: 'application/json' }), // 👈 important
  StripeWebhookController.handleWebhook
);

export default router;