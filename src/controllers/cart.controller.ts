import { Request, Response } from 'express';
import { Cart, WishList } from '../models/cart.model';
import mongoose from 'mongoose';

export const cartController = {
  // ==================== WISHLIST CONTROLLERS ====================

  /**
   * Get user's wishlist
   */
  async getWishlist(req: Request, res: Response) {
    try {
      const wishlist = await WishList.findById(req.userId);
      
      if (!wishlist) {
        return res.status(200).json({
          success: true,
          data: { items: [], itemCount: 0 }
        });
      }

    res.status(200).json({
      success: true,
      data: {
        items: wishlist.items,
        itemCount: wishlist.items.length // Calculating itemCount directly
      }
    });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch wishlist',
        error: (error instanceof Error) ? error.message : 'An unknown error occurred'
      });
    }
  },

  /**
   * Add item to wishlist
   */
  async addToWishlist(req: Request, res: Response) {
    try {
      const { productId, priceWhenAdded } = req.body;

      let wishlist = await WishList.findOne({ userId: req.userId });

      if (!wishlist) {
        wishlist = new WishList({
          userId: req.userId,
          items: [{ productId, priceWhenAdded }]
        });
      } else {
        wishlist.items.push({ productId, priceWhenAdded, currency: 'NGN', addedAt: new Date() });
        
      }

      await wishlist.save();
      
      const populatedWishlist = await WishList.findOne(req.userId);

      res.status(200).json({
        success: true,
        data: {
          items: populatedWishlist?.items || [],
          itemCount: populatedWishlist?.items?.length || 0
        }
      });
    } catch (error) {
      if (error instanceof mongoose.Error.ValidationError) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: Object.values(error.errors).map((err: any) => ({
            field: err.path,
            message: err.message
          }))
        });
      }
      res.status(500).json({
        success: false,
        message: 'Failed to add to wishlist',
        error: (error instanceof Error) ? error.message : 'An unknown error occurred'
      });
    }
  },

  /**
   * Remove item from wishlist
   */
  async removeFromWishlist(req: Request, res: Response) {
    try {
      const { productId } = req.body;

      const wishlist = await WishList.findOneAndUpdate(
        { userId: req.userId },
        { $pull: { items: { productId } } },
        { new: true }
      ).populate('items.productId', 'name price images discountPercentage');

      if (!wishlist) {
        return res.status(200).json({
          success: true,
          data: { items: [], itemCount: 0 }
        });
      }

      res.status(200).json({
        success: true,
        data: {
          items: wishlist.items,
          itemCount: wishlist.items.length // Calculating itemCount directly
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to remove from wishlist',
        error: (error instanceof Error) ? error.message : 'An unknown error occurred'
      });
    }
  },



  async getCart(req: Request, res: Response) {
    try {
      const cart = await Cart.findOne({ userId: req.userId }).populate('items.productId', 'price');
      
      if (!cart) {
        return res.status(200).json({
          success: true,
          data: { 
            items: [], 
            summary: {
              itemsCount: 0,
              totalValue: 0
            }
          },
          message: 'Cart is empty'
        });
      }
  
      const totalValue = cart.items.reduce((sum, item) => 
        sum + ((item.productId as any).price.amount * item.quantity), 0);
        
      res.status(200).json({
        success: true,
        data: {
          items: cart.items,
          summary: {
            itemsCount: cart.items.length,
            totalValue
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch cart',
        error: (error instanceof Error) ? error.message : 'An unknown error occurred'
      });
    }
  },

  /**
   * Add item to cart
   */
  async addToCart(req: Request, res: Response) {
    try {
      const { productId, quantity = 1 } = req.body;

      let cart = await Cart.findOne({ userId: req.userId });

      if (!cart) {
        cart = new Cart({
          userId: req.userId,
          items: [{ productId, quantity }]
        });
      } else {
        // Check if product already exists in cart
        const existingItem = cart.items.find(item => 
          item.productId.toString() === productId
        );

        if (existingItem) {
          existingItem.quantity += quantity;
        } else {
          cart.items.push({ productId, quantity, variantId: null, price: 0, addedAt: new Date() });
        }
      }
      await cart.save();
      
      const populatedCart = await Cart.findById(req.userId);
      const totalValue =  populatedCart ?  populatedCart.items.reduce((sum, item) => sum + ((item.productId as any).price.amount * item.quantity), 0) : 0


      res.status(200).json({
        success: true,
        data: {
          items: populatedCart?.items || [],
          summary: {
            itemsCount: populatedCart?.items.length || 0,
            totalValue
          }
        }
      });
    } catch (error) {
        if (error instanceof mongoose.Error.ValidationError) {
            return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: Object.values(error.errors).map((err: any) => ({
            field: err.path,
            message: err.message
          }))
        });
      }
      res.status(500).json({
        success: false,
        message: 'Failed to add to cart',
        error: (error instanceof Error) ? error.message : 'An unknown error occurred'
      });
    }
  },

  /**
   * Update cart item quantity
   */
  async updateCartItem(req: Request, res: Response) {
    try {
      const { productId, quantity } = req.body;

      const cart = await Cart.findOne({ userId: req.userId });
      if (!cart) {
        return res.status(404).json({
          success: false,
          message: 'Cart not found'
        });
      }

      const item = cart.items.find(item => 
        item.productId.toString() === productId
      );

      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Item not found in cart'
        });
      }

      if (quantity <= 0) {
        // Remove item if quantity is 0 or less
        cart.items = cart.items.filter(item => 
          item.productId.toString() !== productId
        );
      } else {
        item.quantity = quantity;
      }

      await cart.save();
      
      const populatedCart = await Cart.findOne(req.userId);
      const totalValue =  populatedCart ?  populatedCart.items.reduce((sum, item) => sum + ((item.productId as any).price.amount * item.quantity), 0) : 0

      res.status(200).json({
        success: true,
        data: {
          items: populatedCart?.items || [],
          summary: {
            itemsCount: populatedCart?.items.length || 0,
            totalValue
          }
        }
      });
    } catch (error) {
        if (error instanceof mongoose.Error.ValidationError) {
            return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: Object.values(error.errors).map((err: any) => ({
            field: err.path,
            message: err.message
          }))
        });
      }
      res.status(500).json({
        success: false,
        message: 'Failed to update cart',
        error: (error instanceof Error) ? error.message : 'An unknown error occurred'
      });
    }
  },

  /**
   * Clear entire cart
   */
  async clearCart(req: Request, res: Response) {
    try {
      const cart = await Cart.findOneAndUpdate(
        { userId: req.userId },
        { $set: { items: [] } },
        { new: true }
      );

      res.status(200).json({
        success: true,
        data: {
          items: [],
          summary: {
            itemsCount: 0,
            totalValue: 0
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to clear cart',
        error: (error instanceof Error) ? error.message : 'An unknown error occurred'
      });
    }
  },

  /**
   * Get cart summary (count and total value)
   */
  async getCartSummary(req: Request, res: Response) {
    try {
      const cart = await Cart.findOne(req.userId);
      const totalValue =cart ? cart.items.reduce((sum, item) => sum + ((item.productId as any).price.amount * item.quantity), 0): 0

      res.status(200).json({
        success: true,
        data: {
          itemsCount: cart?.items.length || 0,
          totalValue
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get cart summary',
        error: (error instanceof Error) ? error.message : 'An unknown error occurred'
      });
    }
  }
};