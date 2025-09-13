import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import Order from '../../models/order.model';
import User from '../../models/user.model';
import Product from '../../models/product.model';
import jwt from 'jsonwebtoken';

describe('Order Controller', () => {
  let mongoServer: MongoMemoryServer;
  let app: any;
  let userToken: string;
  let userId: string;
  let productId: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    app = require('../../index').default;

    const user = await User.create({
      email: 'user@example.com',
      password: 'password123',
      role: 'personal',
      profile: { firstName: 'Test', lastName: 'User' }
    });

    const product = await Product.create({
      vendorId: new mongoose.Types.ObjectId(),
      name: 'Test Product',
      description: 'Test Description',
      brand: 'Test Brand',
      condition: 'new',
      variants: [{
        name: 'Color',
        options: [{
          value: 'Red',
          sku: 'TEST-RED-001',
          price: 99.99,
          quantity: 10
        }]
      }],
      images: ['https://example.com/image.jpg'],
      shipping: {
        weight: 1,
        unit: 'kg',
        dimensions: { length: 10, width: 10, height: 10 }
      }
    });

    userId = user._id.toString();
    productId = product._id.toString();
    userToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Order.deleteMany({});
  });

  describe('POST /api/orders', () => {
    test('should create a new order', async () => {
      const orderData = {
        items: [{
          productId,
          quantity: 1,
          price: 99.99
        }],
        shipping: {
          address: {
            street: '123 Test St',
            city: 'Test City',
            state: 'Test State',
            country: 'Test Country',
            postalCode: '12345'
          },
          method: 'standard'
        },
        payment: {
          method: 'card',
          amount: 99.99
        }
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(orderData)
        .expect(201);

      expect(response.body.message).toBe('Order created successfully');
      expect(response.body.order.items).toHaveLength(1);
    });
  });

  describe('GET /api/orders/user', () => {
    test('should get user orders', async () => {
      await Order.create({
        userId,
        items: [{
          productId,
          quantity: 1,
          price: 99.99
        }],
        shipping: {
          address: {
            street: '123 Test St',
            city: 'Test City',
            state: 'Test State',
            country: 'Test Country',
            postalCode: '12345'
          },
          method: 'standard'
        },
        payment: {
          method: 'card',
          amount: 99.99
        }
      });

      const response = await request(app)
        .get('/api/orders/user')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.orders).toHaveLength(1);
    });
  });
});