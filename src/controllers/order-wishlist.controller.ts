import { Request, Response } from 'express';
import Cart from '../models/cart.model';
import Product  from '../models/product.model';
import User from '../models/user.model';
import { LoggerService } from '../services/logger.service';
import { validate } from '../middlewares/validate.middleware';
import { orderValidation } from '../validator/order.validate';
import Order from '../models/order.model';
import { PaymentService } from '../services/payment.service';

const logger = LoggerService.getInstance();
const paymentService = new PaymentService();

export const orderController = {
  // Create order from cart
  createOrder: [
    validate(orderValidation.createOrder),
    async (req: Request, res: Response) => {
      try {
        const { paymentMethod, shippingAddressId } = req.body;
        
        // 1. Get user's cart
        const cart = await Cart.findOne({ userId: req.userId })
          .populate('items.productId');
        
        if (!cart || cart.items.length === 0) {
          return res.status(400).json({ 
            success: false, 
            message: 'Cart is empty' 
          });
        }
        
        // 2. Get user's shipping address
        const user = await User.findById(req.userId);
        if (!user) {
          return res.status(404).json({ 
            success: false, 
            message: 'User not found' 
          });
        }
        // Find the shipping address
        
        const shippingAddress = (user?.addresses ?? []).find(addr => 
          (addr?._id?.toString() ?? '') === shippingAddressId
        );
        
        if (!shippingAddress) {
          return res.status(400).json({ 
            success: false, 
            message: 'Shipping address not found' 
          });
        }
        
        // 3. Verify product availability and calculate totals
        let totalAmount = 0;
        const orderItems = [];
        
        for (const item of cart.items) {
          const product = item.productId as any;

          const getProduct = await Product.findById(product)
          const productStock = getProduct?.inventory?.quantity
          // Check stock
          if ((productStock ?? 0) < item.quantity) {
            return res.status(400).json({ 
              success: false, 
              message: `Insufficient stock for product: ${product.name}` 
            });
          }
          
          // Calculate item total
          const itemTotal = (getProduct?.price?.amount ?? 0) * item.quantity;
          totalAmount += itemTotal;
          
          // Prepare order item
          orderItems.push({
            productId: product._id,
            quantity: item.quantity,
            price: getProduct?.price?.amount,
            vendorId: getProduct?.vendorId
          });
          
          // Reduce product stock (we'll update after payment)
          product.stock -= item.quantity;
        }
        
        // 4. Process payment
        const paymentResult = await paymentService.processPayment({
          amount: totalAmount,
          currency: 'USD', // Default currency, can be dynamic
          paymentMethod,
          user: req.userId
        });
        
        if (!paymentResult.success) {
          return res.status(400).json({ 
            success: false, 
            message: paymentResult.message 
          });
        }
        
        // 5. Create order
        const order = new Order({
          userId: req.userId,
          items: orderItems,
          payment: {
            method: paymentMethod,
            status: 'completed',
            transactionId: paymentResult.transactionId,
            amount: totalAmount,
            currency: 'USD'
          },
          shipping: {
            address: {
              street: shippingAddress.street,
              city: shippingAddress.city,
              state: shippingAddress.state,
              country: shippingAddress.country,
              postalCode: shippingAddress.postalCode
            },
            status: 'processing'
          },
          status: 'confirmed'
        });
        
        await order.save();
        
        // 6. Update product stocks
        for (const item of cart.items) {
          const product = item.productId as any;
          await product.save();
        }
        
        // 7. Clear cart
        await Cart.findOneAndUpdate(
          { userId: req.userId },
          { $set: { items: [], lastUpdated: new Date() } }
        );
        
        // 8. Send order confirmation
        
        res.status(201).json({ 
          success: true, 
          message: 'Order created successfully',
          data: order
        });
      } catch (error) {
        logger.error(`Create order error: ${(error as Error).message}`);
        res.status(500).json({ success: false, message: 'Server error' });
      }
    }
  ],

  // Get user's orders
  getOrders: async (req: Request, res: Response) => {
    try {
      const { status, limit = 10, page = 1 } = req.query;
      
      const query: any = { userId: req.userId };
      if (status) query.status = status;
      

      const orders = await Order.find(query)
        .populate('items.productId', 'name images')
        .populate('items.vendorId', 'businessName')
        .populate('items.price')
        .populate('items.quantity')
        .populate('shipping.address')
        .populate('payment.method')
        .populate('payment.status')
        .populate('payment.trackingNumber')
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
      logger.error(`Get orders error: ${(error as Error).message}`);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  // Get order details
  getOrderDetails: async (req: Request, res: Response) => {
    try {
      const order = await Order.findById(req.params.id)
        .populate('items.productId')
        .populate('items.vendorId', 'businessName');
      
      if (!order || order.userId.toString() !== req.userId.toString()) {
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
      logger.error(`Get order details error: ${(error as Error).message}`);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  // Cancel order
  cancelOrder: async (req: Request, res: Response) => {
    try {
      const order = await Order.findOne({
        _id: req.params.id,
        userId: req.userId
      });
      
      if (!order) {
        return res.status(404).json({ 
          success: false, 
          message: 'Order not found' 
        });
      }
      
      // Check if order can be cancelled
      if (!['pending', 'confirmed'].includes(order.status)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Order cannot be cancelled at this stage' 
        });
      }
      
      // Process refund if payment was completed
      if (order.payment.status === 'completed') {
        const refundResult = await paymentService.processRefund({
          transactionId: order.payment.transactionId,
          amount: order.payment.amount
        });
        
        if (!refundResult.success) {
          return res.status(400).json({ 
            success: false, 
            message: refundResult.message 
          });
        }
        
        order.payment.status = 'refunded';
      }
      
      // Update order status
      order.status = 'cancelled';
      await order.save();
      
      // Restore product stock
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: item.quantity }
        });
      }
      
      res.status(200).json({ 
        success: true, 
        message: 'Order cancelled successfully',
        data: order
      });
    } catch (error) {
      logger.error(`Cancel order error: ${(error as Error).message}`);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
};