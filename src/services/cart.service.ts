import {Cart} from "../models/cart.model";
import { WishList } from "../models/cart.model";
import redisService from "./redis.service";
import { LoggerService } from "./logger.service";
import { CartItem, WishlistItem } from "../types/cart.type";

const logger = LoggerService.getInstance();

export class CartService {
  // Cart Methods
  static async getCart(userId: string): Promise<CartItem[]> {
    try {
      let cart: CartItem[] = await redisService.getCart(userId);
      if (!cart || cart.length === 0) {
        const dbCart = await Cart.findOne({ userId }).populate({
          path: "items.productId",
          populate: {
            path: "country",
            model: "Country",
            select: "name currency currencySymbol", // optional fields to include
          },
        });

        if (dbCart && dbCart.items.length > 0) {
          const items: CartItem[] = dbCart.items.map((item: any) => ({
            productId: item.productId.toString(),
            variantId: item.variantId,
            optionId: item.optionId,
            quantity: item.quantity,
            price: item.price,
            name: item.name,
            images: item.images,
            addedAt: item.addedAt,
            vendorCurrency: item.productId.country.currency,
          }));

          for (const item of items) {
            await redisService.addToCart(
              userId,
              item.productId.toString(),
              item.quantity,
              item.price,
              item.name,
              item.images,
              item.variantId,
              item.optionId,
              item.vendorCurrency
            );
          }

          cart = items;
        }
      }

      return cart || [];
    } catch (error) {
      logger.error("Error getting cart:", error);
      return [];
    }
  }

  static async addToCart(userId: string, item: CartItem) {
    
    try {
      // Add to Redis
      await redisService.addToCart(
        userId,
        item.productId.toString(),
        item.quantity,
        item.price,
        item.name,
        item.images,
        item.variantId,
        item.optionId,
        item.vendorCurrency
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
              addedAt: new Date(),
            },
          },
          lastUpdated: new Date(),
        },
        { upsert: true }
      );

      // Return the complete cart with all items
      return await this.getCart(userId);
    } catch (error) {
      console.error(error);
      logger.error("Error adding to cart:", error);
      return false;
    }
  }

  static async removeFromCart(
    userId: string,
    productId: string,
    variantId?: string
  ) {
    try {
      // Remove from Redis
      await redisService.removeFromCart(userId, productId);

      // Remove from MongoDB
      const updateQuery = variantId ? { userId } : { userId };

      const pullQuery = variantId
        ? { items: { productId, variantId } }
        : { items: { productId } };

      await Cart.findOneAndUpdate(updateQuery, { $pull: pullQuery });

      return true;
    } catch (error) {
      logger.error("Error removing from cart:", error);
      return false;
    }
  }

  static async clearCart(userId: string) {
    try {
      await redisService.clearCart(userId);
      await Cart.findOneAndUpdate(
        { userId },
        { items: [], lastUpdated: new Date() }
      );
      return true;
    } catch (error) {
      logger.error("Error clearing cart:", error);
      return false;
    }
  }
  

  // Wishlist Methods
  static async getWishlist(userId: string) {
    try {
      let wishlist = await redisService.getWishlist(userId);

      if (!wishlist || wishlist.length === 0) {
        const dbWishlist = await WishList.findOne({ userId }).populate(
          "items.productId"
        );
        if (dbWishlist && dbWishlist.items.length > 0) {
          // Sync to Redis with full product details
          for (const item of dbWishlist.items) {
            const product = item.productId as any;
            await redisService.addToWishlist(
              userId,
              product._id.toString(),
              item.price,
              product.name,
              product.images,
              item.variantId,
              item.optionId
            );
          }
          wishlist = await redisService.getWishlist(userId);
        }
      }

      return wishlist || [];
    } catch (error) {
      logger.error("Error getting wishlist:", error);
      return [];
    }
  }

  static async addToWishlist(userId: string, item: WishlistItem) {
    try {
      const existing = await WishList.findOne({
        userId,
        "items.productId": item.productId,
      });

      if (!existing) {
        await WishList.findOneAndUpdate(
          { userId },
          {
            $push: {
              items: {
                productId: item.productId,
                priceWhenAdded: item.price,
                variantId: item.variantId,
                optionId: item.optionId,
                addedAt: new Date(),
              },
            },
          },
          { upsert: true }
        );

        await redisService.addToWishlist(
          userId,
          item.productId,
          item.price,
          item.name,
          item.images,
          item.variantId,
          item.optionId,
          item.vendorCurrency
        );
      }

      return true;
    } catch (error) {
      console.error(error);
      logger.error("Error adding to wishlist:", error);
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
      logger.error("Error removing from wishlist:", error);
      return false;
    }
  }

  static async clearWishlist(userId: string) {
    try {
      await redisService.clearWishlist(userId);
      await WishList.findOneAndUpdate({ userId }, { items: [] });
      return true;
    } catch (error) {
      logger.error("Error clearing wishlist:", error);
      return false;
    }
  }
}
