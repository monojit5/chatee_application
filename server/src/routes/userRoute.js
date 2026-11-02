import express from "express";
import {
  getContacts,
  getCurrentUser,
  beginGoogleLogin,
  exchangeGoogleLogin,
  handleGoogleCallback,
  loginUser,
  logoutUser,
  otpVerify,
  registerUser,
  resendOtp,
  updateProfile,
} from "../controllers/userController.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { uploadAvatar } from "../middleware/avatarUpload.js";

const userRouter = express.Router();
userRouter.post("/register", registerUser);
userRouter.post("/otp-verify", otpVerify);
userRouter.post("/otp-resend", resendOtp);
userRouter.post("/login", loginUser);
userRouter.get("/google", beginGoogleLogin);
userRouter.get("/google/callback", handleGoogleCallback);
userRouter.post("/google/exchange", exchangeGoogleLogin);
userRouter.get("/me", requireAuth, getCurrentUser);
userRouter.patch("/profile", requireAuth, uploadAvatar, updateProfile);
userRouter.get("/contacts", requireAuth, getContacts);
userRouter.post("/logout", requireAuth, logoutUser);
export default userRouter;