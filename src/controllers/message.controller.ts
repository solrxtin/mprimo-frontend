import { NextFunction, Request, Response } from "express";
import { IChat } from "../types/chat.type";
import { Chat, Message } from "../models/chat.model";
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
export const openChat = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId      = req.userId;               // comes from auth‑middleware
    const { vendorUserId, productId } = req.body;    

    if (!vendorUserId || !productId) {
      res.status(400).json({ message: "partnerId & productId required" });
      return;
    }

    // ▸ Find chat that already exists for BOTH users on THAT product
    let chat = await Chat.findOne({
      participants: { $all: [userId, vendorUserId] },
      productId
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
 |  2.  Get user’s inbox (list of chats)         |
 *—————————————————————————————————————————————————*/
export const listChats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    const chats = await Chat.find({ participants: userId })
      .populate("productId", "name images")
      .populate("participants", "profile.firstName profile.lastName role")
      .sort({ lastMessageTime: -1 });

    res.json({ success: true, chats });
  } catch (err) {
    next(err);
  }
};


/*—————————————————————————————————————————————————*
 |  3.  Get messages for a chat                  |
 *—————————————————————————————————————————————————*/
export const getMessages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { chatId } = req.params;

    const messages = await Message.find({ chatId })
      .sort({ createdAt: -1 })

    res.json({ success: true, messages });
  } catch (err) {
    next(err);
  }
};


/*—————————————————————————————————————————————————*
 |  4.  Archive / un‑archive for ONE user        |
 *—————————————————————————————————————————————————*/
export const toggleArchive = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId  = req.userId;
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
 |  5.  Mark messages “read”                     |
 *—————————————————————————————————————————————————*/
export const markChatRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId  = req.userId;
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
export const sendMessage = async (req: Request, res: Response, next: NextFunction) => {
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
        flagged: true 
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
    const receiverId = chat.participants.find(id => !id.equals(userId));
    if (!receiverId) {
      res.status(400).json({ message: "Invalid chat participants" });
      return;
    }

    // Create the message
    const message = await Message.create({
      chatId,
      senderId: userId,
      receiverId,
      text: text.trim()
    });

    // Emit real-time message to chat participants
    socketService.emitToRoom(chatId, "chat:message", {
      message: {
        _id: message._id,
        senderId: userId,
        receiverId,
        text: message.text,
        createdAt: message.createdAt,
        read: false
      }
    });

    // Update chat's last message time
    await Chat.findByIdAndUpdate(chatId, { 
      lastMessageTime: new Date() 
    });

    res.status(201).json({ success: true, message });
  } catch (err) {
    next(err);
  }
};


