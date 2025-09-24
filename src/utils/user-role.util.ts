import UserRoleService from '../services/user-role.service';

export const checkUserRoleInOrder = async (userId: string, orderId: string) => {
  return await UserRoleService.determineUserRole(userId, orderId);
};

export const isUserBuyer = async (userId: string, orderId: string): Promise<boolean> => {
  return await UserRoleService.isUserBuyerInOrder(userId, orderId);
};

export const isUserSeller = async (userId: string, orderId: string): Promise<boolean> => {
  return await UserRoleService.isUserSellerInOrder(userId, orderId);
};

export const getUserVendorStatus = async (userId: string) => {
  return await UserRoleService.determineUserRole(userId);
};

// Helper function for controllers
export const validateUserOrderAccess = async (
  userId: string, 
  orderId: string, 
  requiredRole: 'buyer' | 'seller' | 'both'
) => {
  const roleInfo = await UserRoleService.determineUserRole(userId, orderId);
  
  switch (requiredRole) {
    case 'buyer':
      return roleInfo.isBuyer;
    case 'seller':
      return roleInfo.isSeller;
    case 'both':
      return roleInfo.isBuyer || roleInfo.isSeller;
    default:
      return false;
  }
};