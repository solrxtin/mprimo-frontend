import { Request, Response } from 'express';
import {Cart} from '../models/cart.model';
import Product from '../models/product.model';
import User from '../models/user.model';
import { LoggerService } from '../services/logger.service';
import Order from '../models/order.model';
import { PaymentService } from '../services/payment.service';
import mongoose from 'mongoose';

const logger = LoggerService.getInstance();
const paymentService = new PaymentService();

export const orderController = {
  // Create order from cart
  createOrder: async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const { paymentMethod, shippingAddressId } = req.body;
      
      // 1. Get user's cart
      const cart = await Cart.findOne({ userId: req.userId })
        .populate('items.productId')
        .session(session);
      
      if (!cart || cart.items.length === 0) {
        await session.abortTransaction();
        return res.status(400).json({ 
          success: false, 
          message: 'Cart is empty' 
        });
      }
      
      // 2. Get user's shipping address
      const user = await User.findById(req.userId).session(session);
      const shippingAddress = user?.addresses?.find(addr => 
        (addr?._id?.toString() ?? '') === shippingAddressId
      );
      
      if (!shippingAddress) {
        await session.abortTransaction();
        return res.status(400).json({ 
          success: false, 
          message: 'Shipping address not found' 
        });
      }
      
      // 3. Verify products and calculate totals
      let totalAmount = 0;
      const orderItems = [];
      const stockUpdates = [];
      
      for (const item of cart.items) {
        const product = item.productId as any;
        const productDoc = await Product.findById(product._id).session(session);
        
        if (!productDoc) {
          await session.abortTransaction();
          return res.status(400).json({ 
            success: false, 
            message: `Product not found: ${product.name}` 
          });
        }
        
        // Check stock from variants (assuming default variant for simplicity)
        const defaultVariant = productDoc.variants?.find(v => v.isDefault) || productDoc.variants?.[0];
        const defaultOption = defaultVariant?.options?.find(o => o.isDefault) || defaultVariant?.options?.[0];
        
        if (!productDoc || !defaultOption || defaultOption.quantity < item.quantity) {
          await session.abortTransaction();
          return res.status(400).json({ 
            success: false, 
            message: `Insufficient stock for product: ${product.name}` 
          });
        }
        
        const itemTotal = product.price.amount * item.quantity;
        totalAmount += itemTotal;
        
        orderItems.push({
          productId: product._id,
          quantity: item.quantity,
          price: product.price.amount,
          vendorId: product.vendorId
        });
        
        // Update stock for the specific variant option
        stockUpdates.push({
          updateOne: {
            filter: { 
              _id: product._id,
              'variants.options._id': defaultOption._id
            },
            update: { $inc: { 'variants.$.options.$.quantity': -item.quantity } }
          }
        });
      }
      
      // 4. Process payment
      const paymentResult = await paymentService.processPayment({
        amount: totalAmount,
        currency: 'USD',
        paymentMethod,
        user: req.userId
      });
      
      if (!paymentResult.success) {
        await session.abortTransaction();
        return res.status(400).json({ 
          success: false, 
          message: paymentResult.message 
        });
      }
      
      // 5. Group items by vendor and create shipments
      const itemsByVendor = new Map();
      for (const item of orderItems) {
        const vendorId = item.vendorId.toString();
        if (!itemsByVendor.has(vendorId)) {
          itemsByVendor.set(vendorId, []);
        }
        itemsByVendor.get(vendorId).push({
          productId: item.productId,
          variantId: 'default', // Would need actual variant handling
          quantity: item.quantity,
          price: item.price
        });
      }

      const shipments = [];
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + 7);

      for (const [vendorId, items] of itemsByVendor) {
        shipments.push({
          vendorId: new mongoose.Types.ObjectId(vendorId),
          items,
          origin: {
            vendorLocation: {
              country: 'US',
              city: 'Unknown',
              address: 'Unknown',
              coordinates: {
                latitude: 0,
                longitude: 0
              }
            }
          },
          shipping: {
            carrier: 'gig_logistics',
            service: 'standard',
            trackingNumber: `TRK${Date.now()}`,
            status: 'pending',
            estimatedDelivery: deliveryDate,
            cost: { amount: 10, currency: 'USD' }
          },
          deliveryAddress: {
            street: shippingAddress.street,
            city: shippingAddress.city,
            state: shippingAddress.state || '',
            country: shippingAddress.country,
            postalCode: shippingAddress.postalCode
          }
        });
      }

      // 6. Create order with shipments
      const order = new Order({
        userId: req.userId,
        items: orderItems,
        shipments,
        deliveryCoordination: {
          estimatedDeliveryRange: {
            earliest: deliveryDate,
            latest: deliveryDate
          },
          consolidatedDelivery: false
        },
        paymentId: (paymentResult as any).paymentId || new mongoose.Types.ObjectId(), // Use payment ID or create mock
        status: 'processing'
      });
      
      // 6. Execute all updates in transaction
      await Product.bulkWrite(stockUpdates, { session });
      await order.save({ session });
      await Cart.updateOne(
        { userId: req.userId },
        { $set: { items: [], lastUpdated: new Date() } },
        { session }
      );
      
      await session.commitTransaction();
      
      res.status(201).json({ 
        success: true, 
        message: 'Order created successfully',
        data: order
      });
    } catch (error) {
      await session.abortTransaction();
      handleOrderError(error, res);
    } finally {
      session.endSession();
    }
  },

  // Get user's orders
  getOrders: async (req: Request, res: Response) => {
    try {
      const { status, limit = 10, page = 1 } = req.query;
      
      const query: any = { userId: req.userId };
      if (status) query.status = status;
      
      const orders = await Order.find(query)
        .populate({
          path: 'items.productId',
          select: 'name images price'
        })
        .populate({
          path: 'shipments.vendorId',
          select: 'businessInfo.name'
        })
        .populate({
          path: 'shipments.items.productId',
          select: 'name images'
        })
        .populate({
          path: 'paymentId',
          select: 'amount currency status method'
        })
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit));
      
      const totalOrders = await Order.countDocuments(query);
      
      res.status(200).json({ 
        success: true, 
        data: {
          orders,
          pagination: {
            total: totalOrders,
            page: Number(page),
            pages: Math.ceil(totalOrders / Number(limit)),
            limit: Number(limit)
          }
        }
      });
    } catch (error) {
      handleOrderError(error, res);
    }
  },

  // Get order details
  getOrderDetails: async (req: Request, res: Response) => {
    try {
      const order = await Order.findOne({
        _id: req.params.id,
        userId: req.userId
      })
      .populate({
        path: 'items.productId',
        select: 'name images price specifications'
      })
      .populate({
        path: 'shipments.vendorId',
        select: 'businessInfo'
      })
      .populate({
        path: 'shipments.items.productId',
        select: 'name images price specifications'
      })
      .populate({
        path: 'paymentId',
        select: 'amount currency status method'
      });
      
      if (!order) {
        return res.status(404).json({ 
          success: false, 
          message: 'Order not found' 
        });
      }
      
      res.status(200).json({ 
        success: true, 
        data: order 
      });
    } catch (error) {
      handleOrderError(error, res);
    }
  },

  // Cancel order
  cancelOrder: async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const order = await Order.findOne({
        _id: req.params.id,
        userId: req.userId
      }).session(session);
      
      if (!order) {
        await session.abortTransaction();
        return res.status(404).json({ 
          success: false, 
          message: 'Order not found' 
        });
      }
      
      // Validate cancellation
      if (!['pending', 'confirmed'].includes(order.status)) {
        await session.abortTransaction();
        return res.status(400).json({ 
          success: false, 
          message: 'Order cannot be cancelled at this stage' 
        });
      }
      
      // Process refund if needed
      const payment = order.paymentId as any;
      if (payment && payment.status === 'completed') {
        const refundResult = await paymentService.processRefund({
          transactionId: payment.transactionId,
          amount: payment.amount
        });
        
        if (!refundResult.success) {
          await session.abortTransaction();
          return res.status(400).json({ 
            success: false, 
            message: refundResult.message 
          });
        }
      }
      
      // Restore product stock (simplified - would need variant info in real implementation)
      const stockUpdates = [];
      for (const item of order.items) {
        const productDoc = await Product.findById(item.productId).session(session);
        const defaultVariant = productDoc?.variants?.find(v => v.isDefault) || productDoc?.variants?.[0];
        const defaultOption = defaultVariant?.options?.find(o => o.isDefault) || defaultVariant?.options?.[0];
        
        if (defaultOption) {
          stockUpdates.push({
            updateOne: {
              filter: { 
                _id: item.productId,
                'variants.options._id': defaultOption._id
              },
              update: { $inc: { 'variants.$.options.$.quantity': item.quantity } }
            }
          });
        }
      }
      
      if (stockUpdates.length > 0) {
        await Product.bulkWrite(stockUpdates, { session });
      }
      
      // Update order status
      order.status = 'cancelled';
      await order.save({ session });
      
      await session.commitTransaction();
      
      res.status(200).json({ 
        success: true, 
        message: 'Order cancelled successfully',
        data: order
      });
    } catch (error) {
      await session.abortTransaction();
      handleOrderError(error, res);
    } finally {
      session.endSession();
    }
  }
};

// Centralized error handling
function handleOrderError(error: unknown, res: Response) {
  logger.error(`Order error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  
  if (error instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(error.errors).map(err => ({
      field: err.path,
      message: err.message
    }));
    return res.status(400).json({ 
      success: false, 
      message: 'Validation failed',
      errors 
    });
  }
  
  if (error instanceof mongoose.Error.CastError) {
    return res.status(400).json({ 
      success: false, 
      message: `Invalid ${error.path}: ${error.value}`
    });
  }
  
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error' 
  });
}