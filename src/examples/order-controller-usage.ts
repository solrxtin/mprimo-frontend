// Example usage in order controller
import { Request, Response } from 'express';
import { determineUserRole, requireBuyer, requireSeller, requireBuyerOrSeller } from '../middlewares/user-role.middleware';
import { validateUserOrderAccess } from '../utils/user-role.util';

// Example route setup
// router.get('/orders/:orderId', authenticateToken, determineUserRole, requireBuyerOrSeller, getOrderDetails);
// router.patch('/orders/:orderId/cancel', authenticateToken, determineUserRole, requireBuyer, cancelOrder);
// router.patch('/orders/:orderId/ship', authenticateToken, determineUserRole, requireSeller, shipOrder);

interface AuthenticatedRequest extends Request {
  user?: { userId: string };
  userRole?: {
    userId: string;
    orderId?: string;
    isBuyer: boolean;
    isSeller: boolean;
    isVendor: boolean;
    canSell: boolean;
    role: string;
    vendorId?: string;
    sellerProducts?: string[];
  };
}

export const getOrderDetails = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orderId } = req.params;
    const userRole = req.userRole; // Available from middleware
    
    // User role info is already determined by middleware
    console.log('User role info:', userRole);
    
    // Your existing order logic here
    res.json({
      success: true,
      data: {
        order: {}, // your order data
        userRole: {
          isBuyer: userRole?.isBuyer,
          isSeller: userRole?.isSeller,
          canCancel: userRole?.isBuyer,
          canShip: userRole?.isSeller,
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Alternative approach without middleware (for specific cases)
export const checkOrderAccess = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const userId = (req as any).user?.userId;
    
    // Direct validation
    const canAccess = await validateUserOrderAccess(userId, orderId, 'both');
    
    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Continue with logic
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};