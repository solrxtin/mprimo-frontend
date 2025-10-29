import express from "express";
import { AdvertisementController } from "../controllers/advertisement.controller";
import { verifyToken } from "../middlewares/verify-token.middleware";
import { authorizeRole } from "../middlewares/authorize-role.middleware";

const router = express.Router();




// Advertisement Management
router.post("/", verifyToken, authorizeRole(["user"]), AdvertisementController.createAdvertisement);
router.get("/:id/click", AdvertisementController.trackClick);
router.get("/sponsored", AdvertisementController.getSponsoredAds)
router.post("/:id/impression", AdvertisementController.trackImpression);


export default router;