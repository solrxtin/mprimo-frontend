import { Router } from "express";
import { verifyToken } from "../middlewares/verify-token.middleware";
import { requirePermission } from "../middlewares/permission.middleware";
import { PERMISSIONS } from "../constants/permissions";
import * as refundController from "../controllers/refund.controller";

const router = Router();

// Refund Routes (Admin only)
router.post("/:issueId/process", verifyToken, requirePermission([PERMISSIONS.RESOLVE_DISPUTES]), refundController.processRefund);
router.get("/:issueId/eligibility", verifyToken, requirePermission([PERMISSIONS.RESOLVE_DISPUTES]), refundController.getRefundEligibility);

export default router;