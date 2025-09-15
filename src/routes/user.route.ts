import Router, { NextFunction, Request, Response } from "express"
import { verifyToken } from "../middlewares/verify-token.middleware";
import { 
  getUserOrders, 
  addAddress, 
  modifyAddress, 
  deleteAddress, 
  getUserNotifications, 
  getUserRecentViews, 
  getUserProfile, 
  getUserRecommendations, 
  addCard, 
  removeCard, 
  setDefaultCard, 
  updateNotificationPreferences, 
  getFAQs 
} from "../controllers/user.controller";

const router = Router()

// Profile routes
router.get("/profile", verifyToken, getUserProfile);

// Address routes
router.post("/addresses", verifyToken, addAddress);
router.put("/addresses/:id", verifyToken, modifyAddress);
router.delete("/addresses/:id", verifyToken, deleteAddress);

// Order routes
router.get("/orders", verifyToken, getUserOrders);

// Notification routes
router.get("/notifications", verifyToken, getUserNotifications);
router.put("/notifications/preferences", verifyToken, updateNotificationPreferences);

// Recent views
router.get("/recent-views", verifyToken, getUserRecentViews);

// Recommendations
router.get("/recommendations/:userId", getUserRecommendations);

// Payment card routes
router.post("/cards", verifyToken, addCard);
router.delete("/cards/:last4", verifyToken, removeCard);
router.put("/cards/default", verifyToken, setDefaultCard);

// FAQ routes
router.get("/faqs", getFAQs);

export default router