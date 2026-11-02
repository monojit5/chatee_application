import mongoose from "mongoose";
import Conversation from "../models/conversationModel.js";
import Message from "../models/chatModel.js";
import User from "../models/userModel.js";
import { redis } from "../config/redis.js";
import {
  createReplySuggestions,
  validateReplySuggestions,
} from "../services/replySuggestionService.js";

const idOf = (value) => String(value?._id ?? value);

const formatTime = (date) => (
  date ? new Date(date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : ""
);

const ownParticipant = (conversation, userId) => (
  conversation.participants.find((participant) => idOf(participant.user) === idOf(userId))
);

const conversationResponse = (conversation, userId, onlineUsers = new Map()) => {
  const me = ownParticipant(conversation, userId);
  const others = conversation.participants.filter(
    (participant) => idOf(participant.user) !== idOf(userId),
  );
  const members = others.map(({ user }) => ({
    _id: idOf(user),
    name: user.name,
    email: user.email,
    about: user.about || "",
    avatar: user.avatar || "",
  }));
  const other = members[0];
  const cleared = me?.clearedAt && conversation.lastMessageAt <= me.clearedAt;

  return {
    _id: idOf(conversation._id),
    type: conversation.isGroup ? "group" : "direct",
    name: conversation.isGroup ? conversation.name : other?.name || "Unknown contact",
    avatar: conversation.isGroup ? "" : other?.avatar || "",
    about: conversation.isGroup ? `${conversation.participants.length} members` : other?.about || "",
    members,
    online: !conversation.isGroup && onlineUsers.has(idOf(other?._id)),
    lastMessage: cleared ? "" : conversation.lastMessage || "",
    time: cleared || !conversation.lastMessage ? "" : formatTime(conversation.lastMessageAt),
    unread: 0,
    lastMessageFromMe: Boolean(
      !cleared
      && conversation.lastMessage
      && idOf(conversation.lastMessageSender) === idOf(userId),
    ),
    muted: Boolean(me?.muted),
    blocked: Boolean(me?.blocked),
    lastMessageAt: conversation.lastMessageAt,
  };
};

const messageResponse = (message, userId) => ({
  _id: idOf(message._id),
  sender: idOf(message.senderId) === idOf(userId) ? "me" : "other",
  senderId: idOf(message.senderId),
  senderName: message.senderId?.name || "",
  text: message.text || "",
  time: formatTime(message.createdAt),
  createdAt: message.createdAt,
  attachment: message.attachment || undefined,
});

const findAccessibleConversation = async (conversationId, userId) => {
  if (!mongoose.isValidObjectId(conversationId)) return null;
  return Conversation.findOne({
    _id: conversationId,
    "participants.user": userId,
  }).populate("participants.user", "name email avatar about");
};

const emitToMembers = (req, conversation, event, payload) => {
  const io = req.app.get("io");
  if (!io) return;
  conversation.participants.forEach(({ user }) => {
    io.to(`user:${idOf(user)}`).emit(event, payload);
  });
};

const reportServerError = (res, error, action) => {
  console.error(`${action}:`, error);
  return res.status(500).json({ message: `${action} Please try again.` });
};

export const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({ "participants.user": req.user._id })
      .populate("participants.user", "name email avatar about")
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .lean();
    const onlineUsers = req.app.get("onlineUsers") || new Map();
    return res.status(200).json({
      chats: conversations.map((conversation) => (
        conversationResponse(conversation, req.user._id, onlineUsers)
      )),
    });
  } catch (error) {
    return reportServerError(res, error, "Could not load conversations.");
  }
};

export const createDirectConversation = async (req, res) => {
  try {
    const { userId } = req.body || {};
    if (!mongoose.isValidObjectId(userId) || idOf(userId) === idOf(req.user._id)) {
      return res.status(400).json({ message: "Choose a valid contact." });
    }

    const contact = await User.findOne({ _id: userId, isVerified: true }).select("name email avatar about");
    if (!contact) return res.status(404).json({ message: "Contact not found." });

    const participantIds = [idOf(req.user._id), idOf(contact._id)].sort();
    const directKey = participantIds.join(":");
    let conversation = await Conversation.findOne({ directKey });
    if (!conversation) {
      try {
        conversation = await Conversation.create({
          directKey,
          participants: participantIds.map((user) => ({ user })),
          lastMessageAt: new Date(0),
        });
      } catch (error) {
        if (error?.code !== 11000) throw error;
        conversation = await Conversation.findOne({ directKey });
      }
    }

    const populated = await Conversation.findById(conversation._id)
      .populate("participants.user", "name email avatar about");
    const response = conversationResponse(
      populated,
      req.user._id,
      req.app.get("onlineUsers") || new Map(),
    );
    emitToMembers(req, populated, "conversation:updated", response);
    return res.status(200).json({ chat: response });
  } catch (error) {
    return reportServerError(res, error, "Could not start the conversation.");
  }
};

export const createGroupConversation = async (req, res) => {
  try {
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const memberIds = req.body?.memberIds;
    if (!name || name.length > 60 || !Array.isArray(memberIds) || memberIds.length < 1 || memberIds.length > 99) {
      return res.status(400).json({ message: "Enter a group name and choose at least one participant." });
    }

    const ids = [...new Set([idOf(req.user._id), ...memberIds.map(String)])];
    if (ids.length !== memberIds.length + 1 || ids.some((id) => !mongoose.isValidObjectId(id))) {
      return res.status(400).json({ message: "Choose valid group participants." });
    }
    const users = await User.find({ _id: { $in: ids }, isVerified: true })
      .select("name email avatar about");
    if (users.length !== ids.length) {
      return res.status(400).json({ message: "One or more selected participants are unavailable." });
    }

    const conversation = await Conversation.create({
      isGroup: true,
      name,
      participants: ids.map((user) => ({ user })),
      lastMessageAt: new Date(0),
    });
    const populated = await Conversation.findById(conversation._id)
      .populate("participants.user", "name email avatar about");
    const response = conversationResponse(populated, req.user._id);
    emitToMembers(req, populated, "conversation:updated", response);
    return res.status(201).json({ chat: response });
  } catch (error) {
    return reportServerError(res, error, "Could not create the group.");
  }
};

export const getMessages = async (req, res) => {
  try {
    const conversation = await findAccessibleConversation(req.params.conversationId, req.user._id);
    if (!conversation) return res.status(404).json({ message: "Conversation not found." });

    const participant = ownParticipant(conversation, req.user._id);
    const filter = { conversationId: conversation._id };
    if (participant?.clearedAt) filter.createdAt = { $gt: participant.clearedAt };
    const messages = await Message.find(filter)
      .populate("senderId", "name")
      .sort({ createdAt: -1, _id: -1 })
      .limit(500)
      .lean();
    return res.status(200).json({
      messages: messages.reverse().map((message) => messageResponse(message, req.user._id)),
    });
  } catch (error) {
    return reportServerError(res, error, "Could not load messages.");
  }
};

export const getReplySuggestions = async (req, res) => {
  try {
    const conversation = await findAccessibleConversation(req.params.conversationId, req.user._id);
    if (!conversation) return res.status(404).json({ message: "Conversation not found." });

    const participant = ownParticipant(conversation, req.user._id);
    const messageFilter = { conversationId: conversation._id };
    if (participant?.clearedAt) messageFilter.createdAt = { $gt: participant.clearedAt };
    const latestMessage = await Message.findOne(messageFilter)
      .sort({ createdAt: -1, _id: -1 })
      .populate("senderId", "name")
      .lean();

    if (!latestMessage || idOf(latestMessage.senderId) === idOf(req.user._id)) {
      return res.status(200).json({ suggestions: [] });
    }

    const cacheKey = `reply-suggestions:${idOf(conversation._id)}:${idOf(req.user._id)}:${idOf(latestMessage._id)}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      try {
        return res.status(200).json({
          suggestions: validateReplySuggestions(JSON.parse(cached)),
          messageId: idOf(latestMessage._id),
        });
      } catch (error) {
        console.error("Discarding invalid cached reply suggestions:", error);
        await redis.del(cacheKey);
      }
    }

    const recentMessages = await Message.find(messageFilter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(8)
      .populate("senderId", "name")
      .lean();
    const history = recentMessages.reverse().map((message) => ({
      sender: idOf(message.senderId) === idOf(req.user._id) ? "You" : message.senderId?.name || "Contact",
      text: message.text || (
        message.attachment?.type === "image" ? "[shared a photo]" : "[shared a file]"
      ),
    }));

    const suggestions = await createReplySuggestions({
      history: JSON.stringify(history),
      message: latestMessage.text || (
        latestMessage.attachment?.type === "image" ? "[shared a photo]" : "[shared a file]"
      ),
    });
    await redis.setEx(cacheKey, 86400, JSON.stringify(suggestions));
    return res.status(200).json({
      suggestions,
      messageId: idOf(latestMessage._id),
    });
  } catch (error) {
    console.error("Could not generate reply suggestions:", error);
    return res.status(503).json({
      message: "AI reply suggestions are unavailable right now. Please try again.",
    });
  }
};

const validateAttachment = (attachment) => {
  if (!attachment || !["image", "file"].includes(attachment.type)) return null;
  const data = attachment.data;
  const match = typeof data === "string"
    ? data.match(/^data:([\w.+-]+\/[\w.+-]+);base64,([A-Za-z0-9+/]*={0,2})$/)
    : null;
  if (!match) return null;
  const buffer = Buffer.from(match[2], "base64");
  const size = Number(attachment.size);
  const mimeType = match[1].toLowerCase();
  if (
    !buffer.length
    || buffer.length > 1024 * 1024
    || !Number.isInteger(size)
    || size !== buffer.length
    || (attachment.type === "image" && !mimeType.startsWith("image/"))
    || typeof attachment.name !== "string"
    || !attachment.name.trim()
    || attachment.name.length > 255
  ) {
    return null;
  }
  return {
    name: attachment.name.trim(),
    type: attachment.type,
    mimeType,
    data,
    size,
  };
};

export const createMessage = async (req, res) => {
  try {
    const conversation = await findAccessibleConversation(req.params.conversationId, req.user._id);
    if (!conversation) return res.status(404).json({ message: "Conversation not found." });

    const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
    const attachment = req.body?.attachment ? validateAttachment(req.body.attachment) : null;
    if ((!text && !req.body?.attachment) || text.length > 5000) {
      return res.status(400).json({ message: "Write a message or attach a valid file." });
    }
    if (req.body?.attachment && !attachment) {
      return res.status(400).json({ message: "Attachments must be valid files smaller than 1 MB." });
    }
    if (!conversation.isGroup && conversation.participants.some((participant) => participant.blocked)) {
      return res.status(403).json({ message: "This conversation is blocked." });
    }

    const message = await Message.create({
      conversationId: conversation._id,
      senderId: req.user._id,
      text,
      attachment,
    });
    const preview = text || (attachment.type === "image" ? "Photo" : attachment.name);
    conversation.lastMessage = preview;
    conversation.lastMessageSender = req.user._id;
    conversation.lastMessageAt = message.createdAt;
    await conversation.save();

    const populatedMessage = await Message.findById(message._id)
      .populate("senderId", "name")
      .lean();
    const result = messageResponse(populatedMessage, req.user._id);
    const eventMessage = {
      ...result,
      conversationId: idOf(conversation._id),
      senderId: idOf(req.user._id),
    };
    req.app.get("io")?.to(`conversation:${idOf(conversation._id)}`).emit("message:new", eventMessage);
    return res.status(201).json({ message: result });
  } catch (error) {
    return reportServerError(res, error, "Could not send message.");
  }
};

export const clearConversation = async (req, res) => {
  try {
    const conversation = await findAccessibleConversation(req.params.conversationId, req.user._id);
    if (!conversation) return res.status(404).json({ message: "Conversation not found." });

    const participant = ownParticipant(conversation, req.user._id);
    participant.clearedAt = new Date();
    await conversation.save();
    return res.status(200).json({ message: "Conversation cleared." });
  } catch (error) {
    return reportServerError(res, error, "Could not clear the conversation.");
  }
};

export const updateConversationPreferences = async (req, res) => {
  try {
    const conversation = await findAccessibleConversation(req.params.conversationId, req.user._id);
    if (!conversation) return res.status(404).json({ message: "Conversation not found." });

    const updates = req.body || {};
    const keys = Object.keys(updates);
    if (!keys.length || keys.some((key) => !["muted", "blocked"].includes(key))
      || keys.some((key) => typeof updates[key] !== "boolean")
      || (conversation.isGroup && Object.hasOwn(updates, "blocked"))) {
      return res.status(400).json({ message: "Invalid conversation settings." });
    }

    const participant = ownParticipant(conversation, req.user._id);
    keys.forEach((key) => {
      participant[key] = updates[key];
    });
    await conversation.save();
    return res.status(200).json({
      chat: conversationResponse(conversation, req.user._id, req.app.get("onlineUsers") || new Map()),
    });
  } catch (error) {
    return reportServerError(res, error, "Could not update conversation settings.");
  }
};
