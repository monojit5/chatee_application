import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { OAuth2Client } from "google-auth-library";
import User from "../models/userModel.js";
import { userSchema } from "../../validate/validate.js";
import { redis } from "../config/redis.js";
import { sendOtpEmail } from "../verify/email-verify.js";

const uploadDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "uploads",
  "avatars",
);

const userResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  about: user.about || "",
  avatar: user.avatar || "",
});

const normalizeEmail = (email) => (
  typeof email === "string" ? email.trim().toLowerCase() : ""
);

const createOtp = () => crypto.randomInt(100000, 1000000).toString();
const googleClient = () => {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;
  const clientUrl = process.env.API_PUBLIC_URL || `http://localhost:${process.env.PORT || 8000}`;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required for Google sign-in.");
  }
  return {
    client: new OAuth2Client(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      `${clientUrl.replace(/\/$/, "")}/user/google/callback`,
    ),
    frontendUrl: (process.env.CLIENT_URL || "http://localhost:5173").split(",")[0].trim(),
  };
};

export const registerUser = async (req, res) => {
  try {
    const result = userSchema.safeParse({
      ...req.body,
      email: normalizeEmail(req.body?.email),
      name: typeof req.body?.name === "string" ? req.body.name.trim() : req.body?.name,
    });

    if (!result.success) {
      return res.status(400).json({ message: result.error.issues[0].message });
    }

    const { name, email, password } = result.data;
    if (await User.exists({ email })) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const pendingKey = `otp:${email}`;
    const pendingRegistration = await redis.get(pendingKey);
    if (pendingRegistration) {
      return res.status(409).json({ message: "A verification code has already been sent to this email." });
    }

    const userData = {
      name,
      email,
      password: await bcrypt.hash(password, 10),
      otp: createOtp(),
    };

    await redis.setEx(pendingKey, 600, JSON.stringify(userData));
    try {
      await sendOtpEmail(email, userData.otp);
    } catch (error) {
      await redis.del(pendingKey);
      throw error;
    }

    return res.status(200).json({ message: "OTP sent successfully." });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }
    console.error("Could not register user:", error);
    return res.status(500).json({ message: "Could not start registration. Please try again." });
  }
};

export const otpVerify = async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const otp = typeof req.body?.otp === "string" || typeof req.body?.otp === "number"
      ? String(req.body.otp)
      : "";

    if (!email || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ message: "Enter a valid email and 6-digit code." });
    }

    const pendingKey = `otp:${email}`;
    const data = await redis.get(pendingKey);
    if (!data) {
      return res.status(400).json({ message: "OTP expired or not found." });
    }

    const userData = JSON.parse(data);
    if (userData.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP." });
    }

    const user = await User.create({
      email: userData.email,
      password: userData.password,
      name: userData.name,
      isVerified: true,
    });
    await redis.del(pendingKey);

    return res.status(201).json({
      message: "Email verified successfully.",
      user: userResponse(user),
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }
    console.error("Could not verify registration OTP:", error);
    return res.status(500).json({ message: "Could not verify the code. Please try again." });
  }
};

export const resendOtp = async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    if (!email) return res.status(400).json({ message: "Enter a valid email address." });

    if (await User.exists({ email })) {
      return res.status(409).json({ message: "This email is already registered." });
    }

    const pendingKey = `otp:${email}`;
    const data = await redis.get(pendingKey);
    if (!data) {
      return res.status(404).json({ message: "Registration expired. Please register again." });
    }

    const ttl = await redis.ttl(pendingKey);
    if (ttl > 540) {
      return res.status(429).json({ message: "Please wait before requesting another code." });
    }

    const userData = JSON.parse(data);
    userData.otp = createOtp();
    await redis.setEx(pendingKey, 600, JSON.stringify(userData));
    try {
      await sendOtpEmail(email, userData.otp);
    } catch (error) {
      await redis.del(pendingKey);
      throw error;
    }

    return res.status(200).json({ message: "A new verification code was sent." });
  } catch (error) {
    console.error("Could not resend registration OTP:", error);
    return res.status(500).json({ message: "Could not resend the code. Please try again." });
  }
};

export const loginUser = async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = req.body?.password;
    if (!email || typeof password !== "string" || !password) {
      return res.status(400).json({ message: "Enter your email and password." });
    }

    const user = await User.findOne({ email }).select("+password +token");
    if (!user?.password || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }
    if (!user.isVerified) {
      return res.status(403).json({ message: "Please verify your email before logging in." });
    }
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured.");
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    user.token = token;
    user.isLoggedIn = true;
    await user.save();

    return res.status(200).json({
      message: "Login successful.",
      token,
      user: userResponse(user),
    });
  } catch (error) {
    console.error("Could not log in user:", error);
    return res.status(500).json({ message: "Could not log in. Please try again." });
  }
};

export const getCurrentUser = async (req, res) => {
  return res.status(200).json({ user: userResponse(req.user) });
};

const imageFormat = (buffer) => {
  if (
    buffer.length >= 3
    && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
  ) return "jpg";
  if (
    buffer.length >= 8
    && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) return "png";
  if (
    buffer.length >= 12
    && buffer.toString("ascii", 0, 4) === "RIFF"
    && buffer.toString("ascii", 8, 12) === "WEBP"
  ) return "webp";
  return null;
};

const removeOldAvatar = async (avatarUrl) => {
  if (!avatarUrl?.startsWith("/uploads/avatars/")) return;
  const filename = path.basename(avatarUrl);
  if (filename !== avatarUrl.slice("/uploads/avatars/".length)) return;
  try {
    await fs.unlink(path.join(uploadDirectory, filename));
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error("Could not remove previous profile photo:", error);
    }
  }
};

export const updateProfile = async (req, res) => {
  let uploadedAvatarPath;
  try {
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const about = typeof req.body?.about === "string" ? req.body.about.trim() : "";
    if (name.length < 2 || name.length > 100) {
      return res.status(400).json({ message: "Name must be between 2 and 100 characters." });
    }
    if (about.length > 160) {
      return res.status(400).json({ message: "About must be 160 characters or fewer." });
    }

    let avatarUrl = req.user.avatar || "";
    if (req.file) {
      const extension = imageFormat(req.file.buffer);
      if (!extension) {
        return res.status(400).json({ message: "The uploaded file is not a valid JPG, PNG, or WebP image." });
      }

      await fs.mkdir(uploadDirectory, { recursive: true });
      const filename = `${req.user._id}-${crypto.randomUUID()}.${extension}`;
      uploadedAvatarPath = path.join(uploadDirectory, filename);
      await fs.writeFile(uploadedAvatarPath, req.file.buffer, { flag: "wx" });
      avatarUrl = `/uploads/avatars/${filename}`;
    }

    const previousAvatar = req.user.avatar;
    req.user.name = name;
    req.user.about = about;
    req.user.avatar = avatarUrl;
    await req.user.save();

    uploadedAvatarPath = null;
    if (req.file) await removeOldAvatar(previousAvatar);
    return res.status(200).json({
      message: "Profile updated successfully.",
      user: userResponse(req.user),
    });
  } catch (error) {
    if (uploadedAvatarPath) {
      try {
        await fs.unlink(uploadedAvatarPath);
      } catch (cleanupError) {
        if (cleanupError.code !== "ENOENT") {
          console.error("Could not remove incomplete profile photo:", cleanupError);
        }
      }
    }
    console.error("Could not update user profile:", error);
    return res.status(500).json({ message: "Could not update your profile. Please try again." });
  }
};

export const beginGoogleLogin = async (req, res) => {
  try {
    const { client, frontendUrl } = googleClient();
    const state = crypto.randomBytes(32).toString("hex");
    await redis.setEx(`google-oauth-state:${state}`, 600, "pending");
    return res.redirect(client.generateAuthUrl({
      access_type: "online",
      prompt: "select_account",
      scope: ["openid", "email", "profile"],
      state,
    }));
  } catch (error) {
    console.error("Could not start Google sign-in:", error);
    const frontendUrl = (process.env.CLIENT_URL || "http://localhost:5173").split(",")[0].trim();
    return res.redirect(`${frontendUrl}/login?authError=google_not_configured`);
  }
};

export const handleGoogleCallback = async (req, res) => {
  const frontendUrl = (process.env.CLIENT_URL || "http://localhost:5173").split(",")[0].trim();
  const fail = (reason) => res.redirect(
    `${frontendUrl}/login?authError=${encodeURIComponent(reason)}`,
  );
  const { code, state, error: oauthError } = req.query;
  if (oauthError || typeof code !== "string" || typeof state !== "string") {
    return fail(oauthError === "access_denied" ? "google_cancelled" : "google_failed");
  }

  try {
    const stateKey = `google-oauth-state:${state}`;
    const validState = await redis.getDel(stateKey);
    if (!validState) return fail("google_state_invalid");

    const { client } = googleClient();
    const { tokens } = await client.getToken(code);
    if (!tokens.id_token) throw new Error("Google did not return an ID token.");
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const profile = ticket.getPayload();
    if (!profile?.sub || !profile.email || profile.email_verified !== true) {
      throw new Error("Google account must have a verified email address.");
    }

    const email = normalizeEmail(profile.email);
    let user = await User.findOne({
      $or: [{ googleId: profile.sub }, { email }],
    }).select("+token");
    if (!user) {
      user = new User({
        name: profile.name?.trim() || email.split("@")[0],
        email,
        googleId: profile.sub,
        avatar: profile.picture || "",
        isVerified: true,
      });
    } else {
      user.googleId = profile.sub;
      user.isVerified = true;
      if (!user.avatar && profile.picture) user.avatar = profile.picture;
      if (!user.name && profile.name) user.name = profile.name.trim();
    }

    if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not configured.");
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    user.token = token;
    user.isLoggedIn = true;
    await user.save();

    const exchangeCode = crypto.randomBytes(32).toString("hex");
    await redis.setEx(
      `google-login:${exchangeCode}`,
      60,
      JSON.stringify({ token, user: userResponse(user) }),
    );
    return res.redirect(`${frontendUrl}/auth/callback?code=${encodeURIComponent(exchangeCode)}`);
  } catch (error) {
    console.error("Google sign-in failed:", error);
    return fail("google_failed");
  }
};

export const exchangeGoogleLogin = async (req, res) => {
  try {
    const code = typeof req.body?.code === "string" ? req.body.code : "";
    if (!/^[\da-f]{64}$/.test(code)) {
      return res.status(400).json({ message: "Google sign-in code is invalid or expired." });
    }
    const result = await redis.getDel(`google-login:${code}`);
    if (!result) {
      return res.status(400).json({ message: "Google sign-in code is invalid or expired." });
    }
    return res.status(200).json(JSON.parse(result));
  } catch (error) {
    console.error("Could not complete Google sign-in:", error);
    return res.status(500).json({ message: "Could not complete Google sign-in." });
  }
};

export const getContacts = async (req, res) => {
  try {
    const contacts = await User.find({
      _id: { $ne: req.user._id },
      isVerified: true,
    }).select("name email avatar").sort({ name: 1 }).lean();
    return res.status(200).json({
      contacts: contacts.map((contact) => ({
        _id: contact._id,
        name: contact.name,
        email: contact.email,
      })),
    });
  } catch (error) {
    console.error("Could not load contacts:", error);
    return res.status(500).json({ message: "Could not load contacts. Please try again." });
  }
};

export const logoutUser = async (req, res) => {
  try {
    req.user.token = null;
    req.user.isLoggedIn = false;
    await req.user.save();
    return res.status(200).json({ message: "Logged out successfully." });
  } catch (error) {
    console.error("Could not log out user:", error);
    return res.status(500).json({ message: "Could not log out. Please try again." });
  }
};
