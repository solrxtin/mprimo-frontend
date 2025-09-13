import { Router } from "express";
import { verifyToken } from "../middlewares/verify-token.middleware";
import { 
  openChat, 
  listChats, 
  getMessages, 
  sendMessage, 
  toggleArchive, 
  markChatRead 
} from "../controllers/message.controller";

const router = Router();

// All message routes require authentication
router.use(verifyToken);

// Chat management
router.post("/chat/open", openChat);
router.get("/chats", listChats); 
router.get("/chat/:chatId/messages", getMessages); 
router.post("/message", sendMessage);
router.patch("/chat/:chatId/archive", toggleArchive);
router.patch("/chat/:chatId/read", markChatRead);

export default router;