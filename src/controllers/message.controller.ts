import { NextFunction, Request, Response } from "express";
import { IChat } from "../types/chat.type";
import { Chat, Message } from "../models/chat.model";
import Vendor from "../models/vendor.model";
import { socketService } from "..";

const SENSITIVE_PATTERNS: Record<string, RegExp> = {
  // Matches most phone formats: +1 123-456-7890, (123) 456-7890, 123.456.7890, etc.
  phone:
    /\b(?:\+?\d{1,4}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{4}\b/g,

  // Standard email format (case-insensitive)
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z]{2,}\b/gi,

  // URLs: http/https, with optional www and proper domain matching
  url: /\b(?:https?:\/\/|www\.)[^\s]+\.[^\s]{2,}\b/gi,

  // Social media usernames or mentions
  social:
    /\b(@\w{2,}|snap[:]? ?\w+|ig[:]? ?\w+|whatsapp[:]? ?\w+|t\.me\/\w+|facebook\.com\/\w+|x\.com\/\w+)\b/gi,

  // Risky expressions that imply off-platform contact
  riskyWords:
    /\b(call me|text me|dm me|reach me|whatsapp me|telegram me|inbox me|email me|send your number|drop your contact|let's connect outside)\b/gi,
};

function containsSensitiveInfo(message: string): boolean {
  return Object.values(SENSITIVE_PATTERNS).some((pattern) =>
    pattern.test(message)
  );
}

/*—————————————————————————————————————————————————*
 |  1.  Create (or fetch) a chat thread          |
 *—————————————————————————————————————————————————*/
export const openChat = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId; // comes from auth‑middleware
    const { vendorUserId, productId } = req.body;

    if (!vendorUserId || !productId) {
      res.status(400).json({ message: "vendor userId & productId required" });
      return;
    }

    // ▸ Find chat that already exists for BOTH users on THAT product
    let chat = await Chat.findOne({
      participants: { $all: [userId, vendorUserId] },
      productId,
    });

    // ▸ Otherwise create it
    if (!chat) {
      chat = await Chat.create({
        participants: [userId, vendorUserId],
        productId,
      });
    }

    res.json({ success: true, chat });
  } catch (err) {
    next(err);
  }
};

/*—————————————————————————————————————————————————*
 |  2.  Get user's inbox (list of chats)         |
 *—————————————————————————————————————————————————*/
export const listChats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;

    // First, let's get basic chats to debug
    const basicChats = await Chat.find({ participants: userId })
      .populate("productId", "name images vendorId variants inventory")
      .populate(
        "participants",
        "profile.firstName profile.lastName role businessName"
      )
      .sort({ lastMessageTime: -1 });

    if (basicChats.length === 0) {
      return res.json({
        success: true,
        groupedChats: [],
        debug: "No chats found for user",
      });
    }

    // Get recent messages for each chat
    const chatsWithMessages = await Promise.all(
      basicChats.map(async (chat) => {
        const recentMessages = await Message.find({ chatId: chat._id })
          .populate("senderId", "profile.firstName profile.lastName role")
          .populate("receiverId", "profile.firstName profile.lastName role")
          .populate({
            path: "chatId",
            populate: {
              path: "participants",
              model: "User",
              select: "id"
            },
          })
          .sort({ createdAt: -1 })
          // .limit(20);

        const unreadCount = await Message.countDocuments({
          chatId: chat._id,
          receiverId: userId,
          read: false,
        });

        return {
          ...chat.toObject(),
          recentMessages: recentMessages.slice().reverse(),
          unreadCount,
          lastMessage: recentMessages[0] || null, // This is the most recent (before reverse)
        };
      })
    );

    // Group by other participant
    const grouped = new Map();

    for (const chat of chatsWithMessages) {
      const otherParticipant = chat.participants.find(
        (p: any) => !p._id.equals(userId)
      ) as any;

      if (!otherParticipant) continue;

      const participantId = otherParticipant._id.toString();

      // Get business name for vendors
      let participantName = "";
      if (otherParticipant.role === "business") {
        const vendor = await Vendor.findOne({ userId: otherParticipant._id });
        participantName =
          vendor?.businessInfo?.name ||
          `${otherParticipant.profile?.firstName} ${otherParticipant.profile?.lastName}`;
      } else {
        participantName = `${otherParticipant.profile?.firstName} ${otherParticipant.profile?.lastName}`;
      }

      // Check if current user is the product owner
      const product = chat.productId as any;
      const vendor = await Vendor.findOne({ _id: product?.vendorId });
      const isVendor = vendor?.userId?.equals(userId) || false;

      if (!grouped.has(participantId)) {
        grouped.set(participantId, {
          _id: participantId,
          participantName,
          role: otherParticipant.role,
          isVendor,
          totalUnread: 0,
          lastActivity: new Date(0),
          productChats: [],
        });
      }

      const group = grouped.get(participantId);
      group.totalUnread += chat.unreadCount;
      group.lastActivity = new Date(
        Math.max(
          group.lastActivity.getTime(),
          chat.lastMessageTime?.getTime() || 0
        )
      );

      group.productChats.push({
        chatId: chat._id,
        productId: product?._id,
        product: {
          _id: product?._id,
          name: product?.name,
          images: product?.images,
          variants: product?.variants,
          inventory: product?.inventory,
          vendorId: product?.vendorId,
        },
        lastMessage: chat.lastMessage?.text || "",
        lastMessageTime: chat.lastMessage?.createdAt || null,
        unreadCount: chat.unreadCount,
        recentMessages: chat.recentMessages || [],
      });
    }

    const groupedChats = Array.from(grouped.values()).sort(
      (a, b) => b.lastActivity.getTime() - a.lastActivity.getTime()
    );

    // console.log('Grouped chats:', groupedChats.length);

    res.json({ success: true, groupedChats });
  } catch (err) {
    console.error("Chat listing error:", err);
    next(err);
  }
};

/*—————————————————————————————————————————————————*
 |  3.  Get messages for a chat                  |
 *—————————————————————————————————————————————————*/
export const getMessages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    // Paginated messages for older history
    const messages = await Message.find({ chatId })
      .populate("senderId", "profile.firstName profile.lastName role")
      .populate("receiverId", "profile.firstName profile.lastName role")
      .populate({
        path: "chatId",
        populate: {
          path: "productId",
          select: "name images price inventory variants",
        },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const totalMessages = await Message.countDocuments({ chatId });
    const hasMore = skip + messages.length < totalMessages;

    res.json({
      success: true,
      messages: messages.reverse(), // Reverse to show oldest first
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalMessages,
        hasMore,
      },
    });
  } catch (err) {
    next(err);
  }
};

/*—————————————————————————————————————————————————*
 |  4.  Archive / un‑archive for ONE user        |
 *—————————————————————————————————————————————————*/
export const toggleArchive = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    const { chatId } = req.params;
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.participants.includes(userId)) {
      res.status(404).json({ message: "Chat not found" });
      return;
    }

    const currentlyArchived = Boolean(chat.archivedBy?.get(userId.toString()));
    chat.archivedBy?.set(userId.toString(), !currentlyArchived);
    await chat.save();

    res.json({ success: true, archived: !currentlyArchived });
  } catch (err) {
    next(err);
  }
};

/*—————————————————————————————————————————————————*
 |  5.  Mark messages "read"                     |
 *—————————————————————————————————————————————————*/
export const markChatRead = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    const { chatId } = req.params;

    await Message.updateMany(
      { chatId, receiverId: userId, read: false },
      { $set: { read: true } }
    );

    socketService.emitToRoom(chatId, "chat:read", { reader: userId });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

/*—————————————————————————————————————————————————*
 |  6.  Send a message                           |
 *—————————————————————————————————————————————————*/
export const sendMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    const { chatId, text } = req.body;

    if (!chatId || !text?.trim()) {
      res.status(400).json({ message: "Chat ID and message text required" });
      return;
    }

    // Check if message contains sensitive information
    if (containsSensitiveInfo(text)) {
      res.status(400).json({
        message: "Message contains sensitive information and cannot be sent",
        flagged: true,
      });
      return;
    }

    // Verify user is part of this chat
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.participants.includes(userId)) {
      res.status(403).json({ message: "Access denied to this chat" });
      return;
    }

    // Find the other participant (receiver)
    const receiverId = chat.participants.find((id) => !id.equals(userId));
    if (!receiverId) {
      res.status(400).json({ message: "Invalid chat participants" });
      return;
    }

    // Create the message
    const message = await Message.create({
      chatId,
      senderId: userId,
      receiverId,
      text: text.trim(),
    });

    // Emit real-time message to chat participants
    socketService.emitToRoom(chatId, "chat:message", {
      message: {
        _id: message._id,
        senderId: userId,
        receiverId,
        text: message.text,
        createdAt: message.createdAt,
        read: false,
      },
    });

    // Update chat's last message time
    await Chat.findByIdAndUpdate(chatId, {
      lastMessageTime: new Date(),
    });

    res.status(201).json({ success: true, message });
  } catch (err) {
    next(err);
  }
};
