import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { Server } from "socket.io";
import mongoose from "mongoose";
import User from "./src/models/userModel.js";
import Conversation from "./src/models/conversationModel.js";

export function socketConnect(server, allowedOrigins) {
  const onlineUsers = new Map();
  const activeCalls = new Map();
  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
    },
  });
  io.onlineUsers = onlineUsers;

  const finishCall = (callId, reason) => {
    const call = activeCalls.get(callId);
    if (!call) return;
    clearTimeout(call.timeout);
    activeCalls.delete(callId);
    io.to(`user:${call.callerId}`).emit("call:ended", { callId, reason });
    io.to(`user:${call.calleeId}`).emit("call:ended", { callId, reason });
  };

  const getCallPeer = (call, userId) => {
    if (call.callerId === userId) return call.calleeId;
    if (call.calleeId === userId) return call.callerId;
    return null;
  };

  const acknowledge = (callback, response) => {
    if (typeof callback === "function") callback(response);
  };

  const relaySignal = (socket, event, data, callback, isValidPayload) => {
    const call = activeCalls.get(data?.callId);
    const userId = socket.data.userId;
    const peerId = call && getCallPeer(call, userId);
    if (!call || call.status !== "connected" || !peerId) {
      return acknowledge(callback, { ok: false, message: "This call is no longer active." });
    }
    if (!isValidPayload(data?.payload)) {
      return acknowledge(callback, { ok: false, message: "Invalid call signal." });
    }

    io.to(`user:${peerId}`).emit(event, {
      callId: call.callId,
      fromUserId: userId,
      payload: data.payload,
    });
    return acknowledge(callback, { ok: true });
  };

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (typeof token !== "string" || !process.env.JWT_SECRET) {
      return next(new Error("Authentication required."));
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(payload.id).select("+token");
      if (!user || !user.isVerified || user.token !== token) {
        return next(new Error("Authentication required."));
      }
      socket.data.userId = String(user._id);
      socket.data.userName = user.name;
      return next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
        return next(new Error("Authentication required."));
      }
      console.error("Could not authenticate socket connection:", error);
      return next(new Error("Could not authenticate socket connection."));
    }
  });

  io.on("connection", (socket) => {
    const { userId } = socket.data;
    const userRoom = `user:${userId}`;
    socket.join(userRoom);

    const userSockets = onlineUsers.get(userId) || new Set();
    const wasOffline = userSockets.size === 0;
    userSockets.add(socket.id);
    onlineUsers.set(userId, userSockets);
    if (wasOffline) socket.broadcast.emit("presence:update", { userId, online: true });

    socket.on("conversation:join", async (conversationId) => {
      if (!mongoose.isValidObjectId(conversationId)) return;
      try {
        const isParticipant = await Conversation.exists({
          _id: conversationId,
          "participants.user": userId,
        });
        if (isParticipant) socket.join(`conversation:${conversationId}`);
      } catch (error) {
        console.error("Could not join conversation socket room:", error);
        socket.emit("chat:error", { message: "Could not connect to this conversation." });
      }
    });

    socket.on("call:start", async (data, callback) => {
      const { conversationId, callType } = data || {};
      if (
        !mongoose.isValidObjectId(conversationId)
        || !["audio", "video"].includes(callType)
      ) {
        return acknowledge(callback, { ok: false, message: "Choose a valid direct conversation." });
      }

      try {
        const conversation = await Conversation.findById(conversationId)
          .populate("participants.user", "name");
        if (!conversation || conversation.isGroup || conversation.participants.length !== 2) {
          return acknowledge(callback, { ok: false, message: "Calls are only available in direct conversations." });
        }

        const callerId = socket.data.userId;
        const caller = conversation.participants.find(
          (participant) => String(participant.user._id) === callerId,
        );
        const callee = conversation.participants.find(
          (participant) => String(participant.user._id) !== callerId,
        );
        if (!caller || !callee) {
          return acknowledge(callback, { ok: false, message: "You cannot call from this conversation." });
        }
        if (caller.blocked || callee.blocked) {
          return acknowledge(callback, { ok: false, message: "Calls are unavailable for this contact." });
        }

        const calleeId = String(callee.user._id);
        const calleeSocketId = onlineUsers.get(calleeId)?.values().next().value;
        if (!calleeSocketId) {
          return acknowledge(callback, { ok: false, message: "This contact is offline right now." });
        }
        const isBusy = [...activeCalls.values()].some(
          (call) => call.callerId === callerId || call.calleeId === callerId
            || call.callerId === calleeId || call.calleeId === calleeId,
        );
        if (isBusy) {
          return acknowledge(callback, { ok: false, message: "One of you is already in a call." });
        }

        const callId = randomUUID();
        const call = {
          callId,
          conversationId: String(conversation._id),
          callerId,
          calleeId,
          callerSocketId: socket.id,
          calleeSocketId,
          status: "ringing",
          timeout: null,
        };
        call.timeout = setTimeout(() => finishCall(callId, "timeout"), 45000);
        activeCalls.set(callId, call);
        io.to(calleeSocketId).emit("call:incoming", {
          callId,
          conversationId: call.conversationId,
          callerId,
          callerName: caller.user.name,
          callType,
        });
        return acknowledge(callback, { ok: true, callId, peerId: calleeId });
      } catch (error) {
        console.error("Could not start call:", error);
        return acknowledge(callback, { ok: false, message: "Could not start this call. Please try again." });
      }
    });

    socket.on("call:accept", (data, callback) => {
      const call = activeCalls.get(data?.callId);
      if (
        !call
        || call.calleeId !== socket.data.userId
        || call.calleeSocketId !== socket.id
        || call.status !== "ringing"
      ) {
        return acknowledge(callback, { ok: false, message: "This call is no longer available." });
      }
      call.status = "connected";
      clearTimeout(call.timeout);
      io.to(`user:${call.callerId}`).emit("call:accepted", { callId: call.callId });
      return acknowledge(callback, { ok: true });
    });

    socket.on("call:reject", (data, callback) => {
      const call = activeCalls.get(data?.callId);
      if (!call || call.calleeId !== socket.data.userId || call.status !== "ringing") {
        return acknowledge(callback, { ok: false, message: "This call is no longer available." });
      }
      finishCall(call.callId, "declined");
      return acknowledge(callback, { ok: true });
    });

    socket.on("call:end", (data, callback) => {
      const call = activeCalls.get(data?.callId);
      if (!call || !getCallPeer(call, socket.data.userId)) {
        return acknowledge(callback, { ok: false, message: "This call is no longer active." });
      }
      finishCall(call.callId, "ended");
      return acknowledge(callback, { ok: true });
    });

    socket.on("call:offer", (data, callback) => relaySignal(
      socket,
      "call:offer",
      data,
      callback,
      (description) => description?.type === "offer" && typeof description.sdp === "string",
    ));

    socket.on("call:answer", (data, callback) => relaySignal(
      socket,
      "call:answer",
      data,
      callback,
      (description) => description?.type === "answer" && typeof description.sdp === "string",
    ));

    socket.on("call:ice-candidate", (data, callback) => relaySignal(
      socket,
      "call:ice-candidate",
      data,
      callback,
      (candidate) => candidate && typeof candidate.candidate === "string",
    ));

    socket.on("disconnect", () => {
      const connectedSockets = onlineUsers.get(userId);
      connectedSockets?.delete(socket.id);
      activeCalls.forEach((call) => {
        if (call.callerSocketId === socket.id || call.calleeSocketId === socket.id) {
          finishCall(call.callId, "disconnected");
        }
      });
      if (connectedSockets?.size === 0) {
        onlineUsers.delete(userId);
        socket.broadcast.emit("presence:update", { userId, online: false });
      }
    });
  });

  return io;
}
