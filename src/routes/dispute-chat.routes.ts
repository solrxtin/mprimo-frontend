import { Router } from "express";
import { verifyToken } from "../middlewares/verify-token.middleware";
import { uploadDisputeImage, uploadDisputeVideo, uploadDisputeDocument } from "../config/multer.config";
import * as disputeChatController from "../controllers/dispute-chat.controller";

const router = Router();

// Dispute Chat Routes
router.get("/:issueId", verifyToken, disputeChatController.getDisputeChat);
router.post("/:issueId/messages", verifyToken, disputeChatController.sendDisputeMessage);
router.post("/:issueId/media/image", verifyToken, uploadDisputeImage, disputeChatController.sendDisputeMedia);
router.post("/:issueId/media/video", verifyToken, uploadDisputeVideo, disputeChatController.sendDisputeMedia);
router.post("/:issueId/media/document", verifyToken, uploadDisputeDocument, disputeChatController.sendDisputeMedia);
router.patch("/:issueId/read", verifyToken, disputeChatController.markMessagesAsRead);

export default router;