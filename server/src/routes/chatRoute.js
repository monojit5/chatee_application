import express from "express";
import {
  clearConversation,
  createDirectConversation,
  createGroupConversation,
  createMessage,
  getConversations,
  getMessages,
  getReplySuggestions,
  updateConversationPreferences,
} from "../controllers/chatController.js";
import { requireAuth } from "../middleware/requireAuth.js";

const chatRouter = express.Router();

chatRouter.use(requireAuth);
chatRouter.get("/", getConversations);
chatRouter.post("/direct", createDirectConversation);
chatRouter.post("/group", createGroupConversation);
chatRouter.post("/:conversationId/suggestions", getReplySuggestions);
chatRouter.get("/:conversationId/messages", getMessages);
chatRouter.post("/:conversationId/messages", createMessage);
chatRouter.delete("/:conversationId/messages", clearConversation);
chatRouter.patch("/:conversationId/preferences", updateConversationPreferences);

export default chatRouter;
