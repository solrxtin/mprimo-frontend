import { Router } from "express";
import { verifyToken } from "../middlewares/verify-token.middleware";
import * as issueController from "../controllers/issue.controller";

const router = Router();

// Issue Routes (for buyers)
router.post("/", verifyToken, issueController.raiseIssue);
router.get("/", verifyToken, issueController.getUserIssues);

export default router;