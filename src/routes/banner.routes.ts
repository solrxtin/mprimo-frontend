import { Router } from "express";
import * as bannerController from "../controllers/banner.controller";

const router = Router();

// Public routes for tracking (no auth required)
router.get("/click/:bannerId", bannerController.trackBannerClick);
router.post("/impression/:bannerId", bannerController.trackBannerImpression);
router.get("/stats/:bannerId", bannerController.getBannerStats);

export default router;