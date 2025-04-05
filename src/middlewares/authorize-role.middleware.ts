import {Response, NextFunction} from 'express';
import {CustomRequest} from "./verify-token.middleware";

type UserRole = 'customer' | 'vendor' | 'admin';

export const authorizeRole = (roles: UserRole[] = []) => {
    return (req: CustomRequest, res: Response, next: NextFunction) => {
      if (req.user && !roles.includes(req.user.role)) {
        return res.status(403).json({ 
          message: 'Permissions not granted',
          success: false
        });
      }
      next();
    };
};
  