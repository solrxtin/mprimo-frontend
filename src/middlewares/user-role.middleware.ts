import { Request, Response, NextFunction } from 'express';
import UserRoleService from '../services/user-role.service';

export const determineUserRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId?.toString();
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    // Get orderId from params, body, or query
    const orderId = req.params.orderId || req.body.orderId || req.query.orderId as string;

    const roleInfo = await UserRoleService.determineUserRole(userId, orderId);
    req.userRole = roleInfo;

    next();
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const requireBuyer = (req: Request, res: Response, next: NextFunction) => {
  if (!req.userRole?.isBuyer) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. User is not the buyer for this order.',
    });
  }
  next();
};

export const requireSeller = (req: Request, res: Response, next: NextFunction) => {
  if (!req.userRole?.isSeller) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. User is not a seller for this order.',
    });
  }
  next();
};

export const requireVendor = (req: Request, res: Response, next: NextFunction) => {
  if (!req.userRole?.isVendor) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. User is not a vendor.',
    });
  }
  next();
};

export const requireCanSell = (req: Request, res: Response, next: NextFunction) => {
  if (!req.userRole?.canSell) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. User cannot sell on this platform.',
    });
  }
  next();
};

export const requireBuyerOrSeller = (req: Request, res: Response, next: NextFunction) => {
  if (!req.userRole?.isBuyer && !req.userRole?.isSeller) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. User is not involved in this order.',
    });
  }
  next();
};