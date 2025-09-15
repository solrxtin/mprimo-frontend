import {Router} from "express";
import { verifyToken } from "../middlewares/verify-token.middleware";
import * as vendorController from "../controllers/vendor.controller";
import { uploadDocument, uploadImage } from "../config/multer.config";


const router = Router();

router.post(
  "/upload-document",
  verifyToken,
  uploadDocument, // from multer.config
  vendorController.uploadDocument
);

router.post(
  "/advertisements",
  verifyToken,
  uploadImage,
  vendorController.createAdvertisement
);

router.get(
  "/advertisements",
  verifyToken,
  vendorController.getVendorAdvertisements
);

// Additional vendor routes that might be missing
router.get(
  "/profile",
  verifyToken,
  async (req, res) => {
    // Get vendor profile - would need controller method
    res.json({ success: true, vendor: {} });
  }
);

router.put(
  "/profile",
  verifyToken,
  async (req, res) => {
    // Update vendor profile - would need controller method
    res.json({ success: true, message: 'Profile updated' });
  }
);

router.get(
  "/analytics",
  verifyToken,
  async (req, res) => {
    // Get vendor analytics - would need controller method
    res.json({ success: true, analytics: {} });
  }
);

router.get(
  "/subscription",
  verifyToken,
  async (req, res) => {
    // Get vendor subscription - would need controller method
    res.json({ success: true, subscription: {} });
  }
);

export default router
