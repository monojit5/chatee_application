import dotenv from "dotenv";
dotenv.config();
import http from 'http';
import express from "express";
import mongoose from "mongoose";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { connectDb } from "./src/database/db.js";
import userRouter from "./src/routes/userRoute.js";
import chatRouter from "./src/routes/chatRoute.js";
import connectRedis, { redis } from "./src/config/redis.js";
import { socketConnect } from "./socket.js";
import cors from 'cors';

const app = express();
const port = process.env.PORT || 8000;
const serverDirectory = path.dirname(fileURLToPath(import.meta.url));
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origin is not allowed by CORS."));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
}));
app.use(express.json({ limit: "2mb" }));
app.use("/uploads/avatars", express.static(path.join(serverDirectory, "uploads", "avatars"), {
  dotfiles: "deny",
  immutable: true,
  maxAge: "1y",
  index: false,
}));
const server = http.createServer(app);
app.get('/', (req, res) => {
  res.send('Server is running');
});
app.use('/user', userRouter);
app.use('/chat', chatRouter);
app.use((error, req, res, next) => {
  console.error("Unhandled request error:", error);
  if (res.headersSent) return next(error);
  return res.status(500).json({ message: "An unexpected server error occurred." });
});

const startServer = async () => {
  await connectDb();
  await connectRedis();

  const io = socketConnect(server, allowedOrigins);
  app.set("io", io);
  app.set("onlineUsers", io.onlineUsers);

  server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
};

startServer().catch((error) => {
  console.error("Server startup failed:", error.message);
  redis.destroy();
  mongoose.disconnect().catch((disconnectError) => {
    console.error("Could not close the MongoDB connection:", disconnectError.message);
  });
  process.exitCode = 1;
});