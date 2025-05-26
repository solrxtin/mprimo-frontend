import jwt, { JwtPayload } from "jsonwebtoken";
import { Response, Request, NextFunction } from "express";
import User from "../models/user.model";
import { ObjectId } from "mongoose";

interface CustomJwtPayload extends JwtPayload {
  userId: ObjectId;
}

export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies.accessToken;

  if (!token)
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized - no token provided" });
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as CustomJwtPayload;
    if (!decoded)
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized - invalid token" });

    const user = await User.findById(decoded.userId);
    req.userId = decoded.userId;
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    req.user = user;

    next();
  } catch (error) {
    console.log("Error in verifyToken ", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
