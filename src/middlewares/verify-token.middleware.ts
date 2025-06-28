import jwt, { JwtPayload } from "jsonwebtoken";
import { Response, Request, NextFunction } from "express";
import User from "../models/user.model";
import { Types } from "mongoose";

interface CustomJwtPayload extends JwtPayload {
  userId: Types.ObjectId;
}

export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Attempt to get token from cookies or Authorization header
    const token = req.cookies.accessToken || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized - No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as CustomJwtPayload;

    if (!decoded || !decoded.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized - Invalid token" });
    }

    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    req.user = user;
    req.userId = decoded.userId;

    next();
  } catch (error) {
    console.error("Error in verifyToken:", error);

    // Handle token expiration separately
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(403).json({ success: false, message: "Access Token Expired" });
    }

    return res.status(500).json({ success: false, message: "Server error" });
  }
};