import { Router } from "express";
import { verifyToken } from "../middlewares/verify-token.middleware";
import * as issueController from "../controllers/issue.controller";
import { upload } from "../config/multer.config";


const router = Router();

// Issue Routes (for buyers)
router.post("/", verifyToken, issueController.raiseIssue);
router.get("/", verifyToken, issueController.getUserIssues);
router.post(
  '/upload/',
  verifyToken,
  upload.fields([
    { name: 'images', maxCount: 5 },
    { name: 'videos', maxCount: 2 }
  ]),
  issueController.uploadEvidence
);

export default router;
