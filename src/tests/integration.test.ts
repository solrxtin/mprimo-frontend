import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from '../models/user.model';
import Vendor from '../models/vendor.model';
import Product from '../models/product.model';
import Order from '../models/order.model';
import Category from '../models/category.model';
import Country from '../models/country.model';
import Notification from '../models/notification.model';
import Cart, { WishList } from '../models/cart.model';
import { Chat, Message } from '../models/chat.model';
import redisService from '../services/redis.service';
import { generateTrackingNumber } from '../utils/generateTrackingNumber';
import { IPayment } from '../types/payment.type';
import { IOrderPopulated } from '../types/order.type';

describe('E2E Integration Tests', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    console.log('🚀 Connected to test database');
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
    console.log('🔌 Disconnected from test database');
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Vendor.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});
    await Category.deleteMany({});
    await Country.deleteMany({});
    await Notification.deleteMany({});
    await Cart.deleteMany({});
    await WishList.deleteMany({});
    await Chat.deleteMany({});
    await Message.deleteMany({});
  });

  describe('User Management', () => {
    test('should create personal users', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        role: 'personal',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          phone: '+1234567890'
        },
        addresses: [{
          street: '123 Main St',
          city: 'Test City',
          state: 'Test State',
          country: 'Test Country',
          postalCode: '12345',
          isDefault: true
        }],
        preferences: {
          currency: 'USD',
          language: 'en'
        }
      };

      const user = await User.create(userData);

      expect(user.email).toBe(userData.email);
      expect(user.role).toBe('personal');
      expect(user.profile.firstName).toBe('John');
      expect(user.addresses).toHaveLength(1);
      console.log('✅ Personal user created successfully');
    });

    test('should create business users with vendors', async () => {
      const businessUser = await User.create({
        email: 'vendor@example.com',
        password: 'password123',
        role: 'business',
        profile: {
          firstName: 'Jane',
          lastName: 'Smith',
          phone: '+1987654321'
        }
      });

      const vendor = await Vendor.create({
        userId: businessUser._id,
        businessInfo: {
          businessName: 'Test Store',
          businessType: 'retail',
          taxId: 'TAX123456',
          address: {
            street: '456 Business Ave',
            city: 'Business City',
            state: 'Business State',
            country: 'Business Country',
            postalCode: '67890'
          }
        },
        analytics: {
          totalRevenue: 0,
          totalSales: 0,
          averageRating: 0
        }
      });

      expect(businessUser.role).toBe('business');
      expect(vendor?.businessInfo?.name).toBe('Test Store');
      console.log('✅ Business user and vendor created successfully');
    });
  });

  describe('Order Processing with Notifications', () => {
    test('should create order and generate notifications', async () => {
      const customer = await User.create({
        email: 'customer@test.com',
        password: 'password123',
        role: 'personal',
        profile: { firstName: 'Customer', lastName: 'User' },
        addresses: [{
          street: '123 Customer St',
          city: 'Customer City',
          state: 'Customer State',
          country: 'Customer Country',
          postalCode: '12345',
          isDefault: true
        }],
        preferences: { currency: 'USD' }
      });

      const businessUser = await User.create({
        email: 'vendor@test.com',
        password: 'password123',
        role: 'business',
        profile: { firstName: 'Vendor', lastName: 'User' }
      });

      const vendor = await Vendor.create({
        userId: businessUser._id,
        accountType: 'business',
        kycStatus: 'verified',
        businessInfo: {
          name: 'Test Store',
          address: {
            street: '456 Vendor Ave',
            city: 'Vendor City',
            state: 'Vendor State',
            country: 'United States',
            postalCode: '67890'
          }
        }
      });

      const category = await Category.create({
        name: 'Electronics',
        description: 'Electronic devices'
      });

      const country = await Country.create({
        name: 'United States',
        code: 'US',
        currency: 'USD'
      });

      const product = await Product.create({
        vendorId: vendor._id,
        name: 'Test Product',
        brand: 'TestBrand',
        description: 'A test product',
        condition: 'new',
        category: {
          main: category._id,
          sub: [],
          path: ['Electronics']
        },
        country: country._id,
        inventory: {
          lowStockAlert: 5,
          listing: {
            type: 'instant',
            instant: { acceptOffer: false }
          }
        },
        images: ['https://example.com/product.jpg'],
        specifications: [{ key: 'Color', value: 'Black' }],
        shipping: {
          weight: 1,
          unit: 'kg',
          dimensions: { length: 10, width: 10, height: 5 },
          restrictions: ['none']
        },
        variants: [{
          name: 'Default',
          isDefault: true,
          options: [{
            value: 'Standard',
            price: 99.99,
            quantity: 10,
            sku: 'TEST-001',
            isDefault: true
          }]
        }],
        status: 'active',
        analytics: {
          views: 0,
          addToCart: 0,
          wishlist: 0,
          purchases: 0,
          conversionRate: 0
        }
      });

      const orderData = {
        userId: customer._id,
        items: [{
          productId: product._id,
          variantId: 'TEST-001',
          quantity: 2,
          price: 99.99
        }],
        payment: {
          method: 'credit_card',
          amount: 199.98,
          currency: 'USD',
          status: 'pending'
        },
        shipping: {
          address: customer!.addresses![0],
          carrier: 'fedex',
          trackingNumber: generateTrackingNumber(),
          status: 'pending',
          estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        },
        status: 'pending'
      };

      const order = await Order.create(orderData);

      // Create customer notification (order created)
      await Notification.create({
        userId: customer._id,
        case: 'order-created',
        title: 'New Order Created',
        message: `Your order has been placed successfully. Order ID: ${order._id}`,
        type: 'order',
        data: {
          redirectUrl: '/orders',
          entityId: order._id,
          entityType: 'order'
        },
        read: false
      });

      // Create vendor notification (new order received)
      await Notification.create({
        userId: businessUser._id,
        message: `Order ${order._id} for ${product.name}`,
        title: 'New Order Received',
        type: 'order',
        case: 'new-order',
        data: {
          redirectUrl: `/vendor/orders/${order._id}`,
          entityId: order._id,
          entityType: 'order'
        },
        read: false
      });

      // Track purchase event
      try {
        await redisService.trackEvent(
          product._id.toString(),
          'purchase',
          customer._id,
          199.98
        );
      } catch (error) {
        console.log('Redis tracking skipped in test environment');
      }

      expect(order.userId.toString()).toBe(customer._id.toString());
      expect(order.items).toHaveLength(1);
      const populatedOrder = await Order.findById(order._id).populate('paymentId') as IOrderPopulated;
      expect(populatedOrder.paymentId.amount).toBe(199.98);

      const customerNotifications = await Notification.find({ userId: customer._id });
      const vendorNotifications = await Notification.find({ userId: businessUser._id });

      expect(customerNotifications).toHaveLength(1);
      expect(vendorNotifications).toHaveLength(1);
      expect(customerNotifications[0].case).toBe('order-created');
      expect(vendorNotifications[0].case).toBe('new-order');

      console.log('✅ Order created with notifications successfully');
    });
  });

  describe('Full E2E Workflow', () => {
    test('should complete full user journey from registration to order completion', async () => {
      console.log('🚀 Starting full E2E workflow test...');

      const category = await Category.create({
        name: 'E2E Electronics',
        description: 'End-to-end test electronics'
      });

      const country = await Country.create({
        name: 'United States',
        code: 'US',
        currency: 'USD'
      });

      const businessUser = await User.create({
        email: 'e2e-vendor@test.com',
        password: 'password123',
        role: 'business',
        profile: { firstName: 'E2E', lastName: 'Vendor' }
      });

      const vendor = await Vendor.create({
        userId: businessUser._id,
        businessInfo: {
          businessName: 'E2E Test Store',
          businessType: 'retail',
          address: {
            street: '100 E2E Street',
            city: 'E2E City',
            state: 'E2E State',
            country: 'United States',
            postalCode: '00000'
          }
        },
        analytics: {
          totalRevenue: 0,
          totalSales: 0,
          averageRating: 0
        }
      });

      const product = await Product.create({
        vendorId: vendor._id,
        name: 'E2E Test Product',
        brand: 'E2EBrand',
        description: 'Complete end-to-end test product',
        condition: 'new',
        category: {
          main: category._id,
          sub: [],
          path: ['E2E Electronics']
        },
        country: country._id,
        inventory: {
          lowStockAlert: 5,
          listing: {
            type: 'instant',
            instant: { acceptOffer: false }
          }
        },
        images: ['https://example.com/e2e-product.jpg'],
        specifications: [
          { key: 'Test Feature', value: 'Enabled' },
          { key: 'Quality', value: 'Premium' }
        ],
        shipping: {
          weight: 2.5,
          unit: 'kg',
          dimensions: { length: 25, width: 20, height: 10 },
          restrictions: ['none']
        },
        variants: [{
          name: 'Default',
          isDefault: true,
          options: [{
            value: 'Standard',
            price: 299.99,
            quantity: 100,
            sku: 'E2E-PRODUCT-001',
            isDefault: true
          }]
        }],
        status: 'active',
        analytics: {
          views: 0,
          addToCart: 0,
          wishlist: 0,
          purchases: 0,
          conversionRate: 0
        }
      });

      const customer = await User.create({
        email: 'e2e-customer@test.com',
        password: 'password123',
        role: 'personal',
        profile: { firstName: 'E2E', lastName: 'Customer' },
        addresses: [{
          street: '200 Customer Lane',
          city: 'Customer City',
          state: 'Customer State',
          country: 'Customer Country',
          postalCode: '11111',
          isDefault: true
        }],
        preferences: { currency: 'USD' }
      });

      // Customer views product
      try {
        await redisService.trackEvent(product._id.toString(), 'view', customer._id);
      } catch (error) {
        console.log('Redis tracking skipped in test environment');
      }

      // Customer adds to cart
      const cart = await Cart.create({
        userId: customer._id,
        items: [{
          productId: product._id,
          variantId: 'E2E-PRODUCT-001',
          quantity: 1,
          price: 299.99,
          addedAt: new Date()
        }],
        lastUpdated: new Date()
      });

      try {
        await redisService.trackEvent(product._id.toString(), 'addToCart', customer._id);
      } catch (error) {
        console.log('Redis tracking skipped in test environment');
      }

      // Customer places order
      const order = await Order.create({
        userId: customer._id,
        items: [{
          productId: product._id,
          variantId: 'E2E-PRODUCT-001',
          quantity: 1,
          price: 299.99
        }],
        payment: {
          method: 'credit_card',
          amount: 299.99,
          currency: 'USD',
          status: 'completed',
          transactionId: 'e2e-txn-12345'
        },
        shipping: {
          address: customer!.addresses![0],
          carrier: 'fedex',
          trackingNumber: generateTrackingNumber(),
          status: 'processing',
          estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        },
        status: 'processing'
      });

      // Create notifications
      await Notification.create({
        userId: customer._id,
        case: 'order-created',
        title: 'Order Placed Successfully',
        message: `Your order #${order._id} has been placed successfully`,
        type: 'order',
        data: {
          redirectUrl: '/orders',
          entityId: order._id,
          entityType: 'order'
        },
        read: false
      });

      await Notification.create({
        userId: businessUser._id,
        case: 'new-order',
        title: 'New Order Received',
        message: `New order #${order._id} for ${product.name}`,
        type: 'order',
        data: {
          redirectUrl: `/vendor/orders/${order._id}`,
          entityId: order._id,
          entityType: 'order'
        },
        read: false
      });

      // Track purchase
      try {
        await redisService.trackEvent(product._id.toString(), 'purchase', customer._id, 299.99);
      } catch (error) {
        console.log('Redis tracking skipped in test environment');
      }

      // Create chat conversation
      const chat = await Chat.create({
        participants: [customer._id, businessUser._id],
        productId: product._id,
        archivedBy: new Map(),
        lastMessageTime: new Date()
      });

      await Message.insertMany([
        {
          chatId: chat._id,
          senderId: customer._id,
          receiverId: businessUser._id,
          text: 'Hi, I just placed an order. When will it ship?',
          read: false
        },
        {
          chatId: chat._id,
          senderId: businessUser._id,
          receiverId: customer._id,
          text: 'Thank you for your order! It will ship within 24 hours.',
          read: true
        }
      ]);

      // Verify all components
      const finalOrder = await Order.findById(order._id).populate('items.productId paymentId') as IOrderPopulated;
      const notifications = await Notification.find({
        $or: [{ userId: customer._id }, { userId: businessUser._id }]
      });
      const messages = await Message.find({ chatId: chat._id });

      expect(finalOrder).toBeTruthy();
      expect(finalOrder?.items).toHaveLength(1);
      expect(finalOrder.paymentId.amount).toBe(299.99);
      expect(notifications).toHaveLength(2);
      expect(messages).toHaveLength(2);

      console.log('✅ Full E2E workflow completed successfully!');
      console.log(`   - Order ID: ${order._id}`);
      console.log(`   - Product: ${product.name}`);
      console.log(`   - Total: $${finalOrder.paymentId.amount}`);
      console.log(`   - Notifications: ${notifications.length}`);
      console.log(`   - Messages: ${messages.length}`);
    });
  });
});