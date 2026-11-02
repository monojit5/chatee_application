import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

export async function requireAuth(req, res, next) {
  const authorization = req.headers.authorization || "";
  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Authentication required." });
  }
  if (!process.env.JWT_SECRET) {
    return next(new Error("JWT_SECRET is not configured."));
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: "Your session has expired. Please log in again." });
  }

  try {
    const user = await User.findById(payload.id).select("+token");
    if (!user || !user.isVerified || user.token !== token) {
      return res.status(401).json({ message: "Your session is no longer valid. Please log in again." });
    }
    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
}
