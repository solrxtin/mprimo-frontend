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

export default router
