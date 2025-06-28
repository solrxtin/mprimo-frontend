import { Request, Response } from "express";
import { IChat } from "../types/chat.type";
import { Chat, Message } from "../models/chat.model";

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

const sendMessage = async (req: Request, res: Response) => {
  const { senderId, receiverId, message, chatId, productId } = req.body;
  try {
    if (!senderId || !receiverId || !message || !productId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    let chat: IChat | null;
    if (chatId) {
      chat = await Chat.findById(chatId);
      if (!chat) return res.status(404).json({ message: "Chat not found" });
    } else {
      chat = await Chat.findOneAndUpdate(
        {
          participants: { $all: [senderId, receiverId] },
          productId,
        },
        {},
        {
          new: true,
          upsert: true, // create if doesn't exist
          setDefaultsOnInsert: true,
        }
      );
    }
    const isFlagged = containsSensitiveInfo(message);
    const flaggedReason = isFlagged ? "Contains sensitive information" : "";

    const newMessage = await Message.create({
      chatId: chat?._id,
      senderId,
      receiverId,
      text: message,
    });

    if (isFlagged) {
      newMessage.isFlagged = true;
      newMessage.flaggedReason = flaggedReason;
      await newMessage.save();
    }

    res.status(200).json({ message: "Message sent successfully", chat });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getMessages = async (req: Request, res: Response) => {
  const { chatId } = req.params;
  try {
    if (!chatId) {
      return res.status(400).json({ message: "Chat ID is required" });
    }
    const messages = await Message.find({ chatId }).populate("senderId receiverId chatId").sort({ createdAt: 1 });
    res.status(200).json({ messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};



export { sendMessage, getMessages };