import { Router } from 'express';
import { CheckoutController } from '../controllers/checkout.controller';
import { verifyToken } from '../middlewares/verify-token.middleware';

const router = Router();

// Protected routes
router.use(verifyToken);

// Validate cart and get checkout summary
router.post('/validate', CheckoutController.validateCart);

// Create payment intent after validation
router.post('/payment-intent', CheckoutController.createPaymentIntent);

export default router;