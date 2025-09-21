import { Request, Response } from "express";
import { DisputeChat, DisputeMessage } from "../models/dispute-chat.model";
import Issue from "../models/issue.model";
import { uploadImageToCloudinary, uploadVideoToCloudinary, uploadDocumentToCloudinary } from "../config/multer.config";


export const createDisputeChat = async (issueId: string, participants: string[]) => {
  const disputeChat = await DisputeChat.create({
    issueId,
    participants
  });
  
  await Issue.findByIdAndUpdate(issueId, { chatId: disputeChat._id });
  return disputeChat;
};

export const getDisputeChat = async (req: Request, res: Response) => {
  try {
    const { issueId } = req.params;
    const userId = req.userId;

    const issue = await Issue.findById(issueId);
    if (!issue) {
      return res.status(404).json({ success: false, message: "Issue not found" });
    }

    const disputeChat = await DisputeChat.findOne({ issueId })
      .populate("participants", "email profile.firstName profile.lastName role");

    if (!disputeChat) {
      return res.status(404).json({ success: false, message: "Dispute chat not found" });
    }

    if (!disputeChat.participants.some((p: any) => p._id.toString() === userId)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const messages = await DisputeMessage.find({ disputeChatId: disputeChat._id })
      .populate("senderId", "email profile.firstName profile.lastName role")
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      data: { disputeChat, messages }
    });
  } catch (error) {
    console.error("Get dispute chat error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const sendDisputeMessage = async (req: Request, res: Response) => {
  try {
    const { issueId } = req.params;
    const { text } = req.body;
    const senderId = req.userId;

    const disputeChat = await DisputeChat.findOne({ issueId });
    if (!disputeChat) {
      return res.status(404).json({ success: false, message: "Dispute chat not found" });
    }

    if (!disputeChat.participants.some((p: any) => p.toString() === senderId)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const message = await DisputeMessage.create({
      disputeChatId: disputeChat._id,
      senderId,
      text
    });

    disputeChat.lastMessageTime = new Date();
    await disputeChat.save();

    const populatedMessage = await DisputeMessage.findById(message._id)
      .populate("senderId", "email profile.firstName profile.lastName role");

    res.json({
      success: true,
      data: populatedMessage
    });
  } catch (error) {
    console.error("Send dispute message error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const markMessagesAsRead = async (req: Request, res: Response) => {
  try {
    const { issueId } = req.params;
    const userId = req.userId;

    const disputeChat = await DisputeChat.findOne({ issueId });
    if (!disputeChat) {
      return res.status(404).json({ success: false, message: "Dispute chat not found" });
    }

    await DisputeMessage.updateMany(
      { disputeChatId: disputeChat._id },
      { $set: { [`readBy.${userId}`]: new Date() } }
    );

    res.json({ success: true, message: "Messages marked as read" });
  } catch (error) {
    console.error("Mark messages as read error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const sendDisputeMedia = async (req: Request, res: Response) => {
  try {
    const { issueId } = req.params;
    const { messageType } = req.body;
    const senderId = req.userId;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    // Check subscription for file sharing in messaging
    const { SubscriptionService } = await import('../services/subscription.service');
    const Vendor = (await import('../models/vendor.model')).default;
    
    const vendor = await Vendor.findOne({ userId: senderId });
    if (vendor) {
      const hasFullMessaging = await SubscriptionService.checkPlanLimits(
        vendor._id.toString(),
        'full_messaging'
      );
      
      if (!hasFullMessaging) {
        return res.status(403).json({
          success: false,
          message: 'File sharing in messages requires Pro or Elite plan. Upgrade to send files.'
        });
      }
    }

    const disputeChat = await DisputeChat.findOne({ issueId });
    if (!disputeChat) {
      return res.status(404).json({ success: false, message: "Dispute chat not found" });
    }

    if (!disputeChat.participants.some((p: any) => p.toString() === senderId)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    let uploadResult;
    switch (messageType) {
      case "image":
        uploadResult = await uploadImageToCloudinary(file.path, "dispute-images");
        break;
      case "video":
        uploadResult = await uploadVideoToCloudinary(file.path, "dispute-videos");
        break;
      case "document":
        uploadResult = await uploadDocumentToCloudinary(file.path, "dispute-documents");
        break;
      default:
        return res.status(400).json({ success: false, message: "Invalid message type" });
    }

    const message = await DisputeMessage.create({
      disputeChatId: disputeChat._id,
      senderId,
      messageType,
      attachment: {
        url: uploadResult.url,
        publicId: uploadResult.public_id,
        fileName: file.originalname,
        fileSize: file.size
      }
    });

    disputeChat.lastMessageTime = new Date();
    await disputeChat.save();

    const populatedMessage = await DisputeMessage.findById(message._id)
      .populate("senderId", "email profile.firstName profile.lastName role");

    res.json({
      success: true,
      data: populatedMessage
    });
  } catch (error) {
    console.error("Send dispute media error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};