import { Response, Request, NextFunction } from "express";
import User from "../models/user.model";

type UserRole = "customer" | "vendor" | "admin";

interface AuthorizeRoleParams {
  roles: UserRole[];
  req: Request;
  res: Response;
  next: NextFunction;
}

export const authorizeRole = async ({ roles, req, res, next }: AuthorizeRoleParams) => {
  console.log("authorizeRole middleware called", req.userId);
  const user = await User.findById(req.userId);
  console.log(user);

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


// export const authorizeVendor = () => {
//   return (req: Request, res: Response, next: NextFunction) => {
//     if (req.user && req.user.role !== "vendor") {
//       return res.status(403).json({
//         message: "Permissions not granted",
//         success: false,
//       });
//     }
//     next();
//   };
// };
