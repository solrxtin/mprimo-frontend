import { Response, Request, NextFunction } from "express";
import User from "../models/user.model";
import { IUser } from "../types/user.type";

type UserRole = "personal" | "business" | "admin";

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


export const authorizeVendor = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Unauthorized",
      success: false,
    });
  }

  const user = req.user as IUser;

  if (user.status === "inactive") {
    return res.status(403).json({
      message: "Account is inactive",
      success: false,
    });
  }

  if (user.role === "business") {
    return next();
  }

  if (user.role === "personal" && user.canMakeSales) {
    return next();
  }

  return res.status(403).json({
    message: "Permissions not granted",
    success: false,
  });
};
