import { NextFunction, Request, Response } from "express";
import { PERMISSIONS } from "../constants/permissions";
import { ROLE_PERMISSIONS } from "../constants/roles.config";
import { IUser } from "../types/user.type";


export function hasPermission(user: IUser, permissions: string[]): boolean {
  const rolePerms = ROLE_PERMISSIONS[user?.adminRole as keyof typeof ROLE_PERMISSIONS] || [];

  return permissions.some(permission =>
    rolePerms.includes(PERMISSIONS.FULL_ACCESS) ||
    rolePerms.includes(permission) ||
    user?.permissions?.includes(permission)
  );
}

export const requirePermission = (permissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as IUser;
    if (!user || !hasPermission(user, permissions)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
};
