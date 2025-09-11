import { Router } from "express";
import { verifyToken } from "../middlewares/verify-token.middleware";
import { 
  getVendorReviews, 
  addVendorResponse, 
  toggleHelpful 
} from "../controllers/review.controller";
import {
  getProductReviewAnalytics,
  getVendorReviewAnalytics
} from "../controllers/review-analytics.controller";
import { authorizeVendor } from "../middlewares/authorize-role.middleware";

const router = Router();

// All review routes require authentication
router.use(verifyToken);

// Toggle helpful on review
router.patch("/product/:productId/review/:reviewId/helpful", toggleHelpful);

// Review analytics
router.get("/product/:productId/analytics", getProductReviewAnalytics);
router.get("/vendor/:vendorId/analytics", getVendorReviewAnalytics);

// ✅ Only business users can access the routes below
router.use(authorizeVendor);

// Get all reviews for vendor's products
router.get("/vendor/:vendorId", getVendorReviews);

// Add vendor response to review
router.post("/product/:productId/review/:reviewId/response", addVendorResponse);



export default router;