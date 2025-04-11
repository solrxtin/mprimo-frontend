import { Response, Request, NextFunction } from "express";
import User from "../models/user.model";

type UserRole = "customer" | "vendor" | "admin";

export const authorizeRole = (roles: UserRole[] = []) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found", success: false });
    }
    if (!roles.includes(user.role)) {
      return res.status(403).json({
        message: "Permissions not granted",
        success: false,
      });
    }
    next();
  };
};

export const authorizeVendor = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.user && req.user.role !== "vendor") {
      return res.status(403).json({
        message: "Permissions not granted",
        success: false,
      });
    }
    next();
  };
};
