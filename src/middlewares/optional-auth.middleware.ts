import jwt, { JwtPayload } from "jsonwebtoken";
import { Response, Request, NextFunction } from "express";
import User from "../models/user.model";
import { Types } from "mongoose";

interface CustomJwtPayload extends JwtPayload {
  userId: Types.ObjectId;
}

export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.accessToken || req.headers.authorization?.split(" ")[1];

    if (!token) {
      next();
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as CustomJwtPayload;

    if (decoded && decoded.userId) {
      const user = await User.findById(decoded.userId);
      if (user) {
        req.user = user;
        req.userId = decoded.userId;
        console.log('User authenticated via optional auth:', decoded.userId);
      }
    }

    next();
  } catch (error) {
    console.log('Token invalid or expired, continuing without authentication');
    next();
  }
};