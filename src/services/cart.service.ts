import { Cart, WishList } from '../models/cart.model';
import redisService from './redis.service';
import { LoggerService } from './logger.service';

const logger = LoggerService.getInstance();

interface CartItem {
  productId: string;
  variantId: string;
  quantity: number;
  price: number;
}

interface WishlistItem {
  productId: string;
  priceWhenAdded: number;
  currency: string;
}

export class CartService {
  // Cart Methods
  static async getCart(userId: string) {
    try {
      // Try Redis first
      let cart = await redisService.getCart(userId);
      
      if (!cart || cart.length === 0) {
        // Fallback to MongoDB
        const dbCart = await Cart.findOne({ userId }).populate('items.productId');
        if (dbCart && dbCart.items.length > 0) {
          // Sync to Redis
          for (const item of dbCart.items) {
            await redisService.addToCart(
              userId,
              item.productId.toString(),
              item.quantity,
              item.price,
              item.variantId
            );
          }
          cart = dbCart.items;
        }
      }
      
      return cart || [];
    } catch (error) {
      logger.error('Error getting cart:', error);
      return [];
    }
  }

  static async addToCart(userId: string, item: CartItem) {
    try {
      // Add to Redis
      await redisService.addToCart(
        userId,
        item.productId,
        item.quantity,
        item.price,
        item.variantId
      );

      // Add to MongoDB
      await Cart.findOneAndUpdate(
        { userId },
        {
          $push: {
            items: {
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
              price: item.price,
              addedAt: new Date()
            }
          },
          lastUpdated: new Date()
        },
        { upsert: true }
      );

      return true;
    } catch (error) {
      logger.error('Error adding to cart:', error);
      return false;
    }
  }

  static async removeFromCart(userId: string, productId: string, variantId?: string) {
    try {
      // Remove from Redis
      await redisService.removeFromCart(userId, productId);

      // Remove from MongoDB
      const updateQuery = variantId 
        ? { userId }
        : { userId };
      
      const pullQuery = variantId
        ? { items: { productId, variantId } }
        : { items: { productId } };

      await Cart.findOneAndUpdate(updateQuery, { $pull: pullQuery });

      return true;
    } catch (error) {
      logger.error('Error removing from cart:', error);
      return false;
    }
  }

  static async clearCart(userId: string) {
    try {
      await redisService.clearCart(userId);
      await Cart.findOneAndUpdate({ userId }, { items: [], lastUpdated: new Date() });
      return true;
    } catch (error) {
      logger.error('Error clearing cart:', error);
      return false;
    }
  }

  // Wishlist Methods
  static async getWishlist(userId: string) {
    try {
      let wishlist = await redisService.getWishlist(userId);
      
      if (!wishlist || wishlist.length === 0) {
        const dbWishlist = await WishList.findOne({ userId }).populate('items.productId');
        if (dbWishlist && dbWishlist.items.length > 0) {
          // Sync to Redis
          for (const item of dbWishlist.items) {
            await redisService.addToWishlist(userId, item.productId.toString());
          }
          wishlist = dbWishlist.items.map(item => item.productId.toString());
        }
      }
      
      return wishlist || [];
    } catch (error) {
      logger.error('Error getting wishlist:', error);
      return [];
    }
  }

  static async addToWishlist(userId: string, item: WishlistItem) {
    try {
      await redisService.addToWishlist(userId, item.productId);

      await WishList.findOneAndUpdate(
        { userId },
        {
          $push: {
            items: {
              productId: item.productId,
              priceWhenAdded: item.priceWhenAdded,
              currency: item.currency,
              addedAt: new Date()
            }
          }
        },
        { upsert: true }
      );

      return true;
    } catch (error) {
      logger.error('Error adding to wishlist:', error);
      return false;
    }
  }

  static async removeFromWishlist(userId: string, productId: string) {
    try {
      await redisService.removeFromWishlist(userId, productId);
      await WishList.findOneAndUpdate(
        { userId },
        { $pull: { items: { productId } } }
      );
      return true;
    } catch (error) {
      logger.error('Error removing from wishlist:', error);
      return false;
    }
  }

  static async clearWishlist(userId: string) {
    try {
      await redisService.clearWishlist(userId);
      await WishList.findOneAndUpdate({ userId }, { items: [] });
      return true;
    } catch (error) {
      logger.error('Error clearing wishlist:', error);
      return false;
    }
  }
}