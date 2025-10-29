import { Router } from 'express';
import { SubscriptionController } from '../controllers/subscription.controller';
import { verifyToken } from '../middlewares/verify-token.middleware';
import { authorizeRole } from '../middlewares/authorize-role.middleware';

const router = Router();

// Public routes
router.get('/plans', SubscriptionController.getPlans);

// Protected routes
router.use(verifyToken);

// Vendor subscription management
router.get('/vendor/:vendorId', 
  authorizeRole(['user', 'admin']), 
  SubscriptionController.getVendorSubscription
);

router.post('/vendor/:vendorId/upgrade', 
  authorizeRole(['user', 'admin']), 
  SubscriptionController.upgradeSubscription
);

router.get('/vendor/:vendorId/limits', 
  authorizeRole(['user', 'admin']), 
  SubscriptionController.checkLimits
);

// Wallet and payouts
router.get('/vendor/:vendorId/wallet', 
  authorizeRole(['user', 'admin']), 
  SubscriptionController.getWallet
);

router.post('/vendor/:vendorId/payout', 
  authorizeRole(['user', 'admin']), 
  SubscriptionController.requestPayout
);

router.get('/vendor/:vendorId/payouts', 
  authorizeRole(['user', 'admin']), 
  SubscriptionController.getPayoutRequests
);

export default router;