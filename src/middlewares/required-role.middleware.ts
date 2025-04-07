import { Request, Response, NextFunction } from 'express';

interface CustomRequest extends Request {
  user?: { role: string };
}

// i did this middleware to check if the user has the required role
// and if not, it will return a 403 error
export const requireRoles = (roles: string[]) => {
    return (req: CustomRequest, res: Response, next: NextFunction) => {
      if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: `Required roles: ${roles.join(', ')}`
        });
      }
      next();
    };
  };