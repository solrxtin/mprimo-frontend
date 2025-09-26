import Router, { NextFunction, Request, Response } from "express"
import { verifyToken } from "../middlewares/verify-token.middleware";
import { getUserOrders, getUserAddress, getUserOffersForAProduct, getUserOffersGrouped, addAddress, modifyAddress, deleteAddress, getUserNotifications, getUserRecentViews, getUserProfile, getUserRecommendations, addCard, removeCard, setDefaultCard, updateNotificationPreferences } from "../controllers/user.controller";



const router = Router()

// Address management
router.post("/address", verifyToken, addAddress);
router.get("/address", verifyToken, getUserAddress);
router.patch("/address", verifyToken, modifyAddress);
router.delete("/address", verifyToken, deleteAddress);

router.get("/notifications", verifyToken, getUserNotifications)
router.patch("/notifications/preferences", verifyToken, updateNotificationPreferences)
router.get("/recent-views", verifyToken, getUserRecentViews)
router.get("/profile", verifyToken, getUserProfile)
router.get("/recommendations", verifyToken, getUserRecommendations)

router.get(
  "/orders",
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await getUserOrders(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/offers",
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await getUserOffersGrouped(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/offers/:productId",
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  getUserOffersForAProduct
);

// Card management
router.post("/card", verifyToken, addCard);
router.patch("/card", verifyToken, setDefaultCard);
router.delete("/card/:last4", verifyToken, removeCard);


export default router