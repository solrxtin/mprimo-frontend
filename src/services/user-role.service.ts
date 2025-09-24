import Order from '../models/order.model';
import Product from '../models/product.model';
import User from '../models/user.model';
import Vendor from '../models/vendor.model';

export class UserRoleService {
  static async determineUserRole(userId: string, orderId?: string) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    // Check if user is a vendor
    const vendor = await Vendor.findOne({ userId });
    const isVendor = !!vendor;

    // If no orderId provided, return general role info
    if (!orderId) {
      return {
        userId,
        isVendor,
        canSell: user.canMakeSales || isVendor,
        role: user.role,
        vendorId: vendor?._id?.toString(),
        isBuyer: false,
        isSeller: false,
      };
    }

    // Check user's relationship to specific order
    const order = await Order.findById(orderId).populate('items.productId');
    if (!order) throw new Error('Order not found');

    const isBuyer = order.userId.toString() === userId;
    let isSeller = false;
    let sellerProducts: string[] = [];

    // Check if user is selling any products in this order
    if (isVendor) {
      for (const item of order.items) {
        const product = await Product.findById(item.productId);
        if (product && product.vendorId.toString() === vendor._id.toString()) {
          isSeller = true;
          sellerProducts.push(product._id.toString());
        }
      }
    }

    return {
      userId,
      orderId,
      isBuyer,
      isSeller,
      isVendor,
      canSell: user.canMakeSales || isVendor,
      role: user.role,
      vendorId: vendor?._id?.toString(),
      sellerProducts,
      orderStatus: order.status,
    };
  }

  static async isUserSellerInOrder(userId: string, orderId: string): Promise<boolean> {
    const roleInfo = await this.determineUserRole(userId, orderId);
    return roleInfo.isSeller;
  }

  static async isUserBuyerInOrder(userId: string, orderId: string): Promise<boolean> {
    const roleInfo = await this.determineUserRole(userId, orderId);
    return roleInfo.isBuyer;
  }

  static async getUserVendorId(userId: string): Promise<string | null> {
    const vendor = await Vendor.findOne({ userId });
    return vendor?._id.toString() || null;
  }
}

export default UserRoleService;