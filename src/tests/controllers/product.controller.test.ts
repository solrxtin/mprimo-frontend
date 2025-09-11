import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import Product from '../../models/product.model';
import User from '../../models/user.model';
import Vendor from '../../models/vendor.model';
import jwt from 'jsonwebtoken';

describe('Product Controller', () => {
  let mongoServer: MongoMemoryServer;
  let app: any;
  let vendorToken: string;
  let vendorId: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    app = require('../../index').default;

    // Create vendor user
    const vendor = await User.create({
      email: 'vendor@example.com',
      password: 'password123',
      role: 'business',
      profile: { firstName: 'Vendor', lastName: 'User' }
    });

    const vendorDoc = await Vendor.create({
      userId: vendor._id,
      accountType: 'business',
      businessInfo: {
        name: 'Test Business',
        address: {
          street: '123 Test St',
          city: 'Test City',
          state: 'Test State',
          country: 'Test Country',
          postalCode: '12345'
        }
      }
    });

    vendorId = vendorDoc._id.toString();
    vendorToken = jwt.sign({ userId: vendor._id }, process.env.JWT_SECRET!);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Product.deleteMany({});
  });

  describe('POST /api/products', () => {
    test('should create a new product', async () => {
      const productData = {
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
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send(productData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.product.name).toBe(productData.name);
    });
  });

  describe('GET /api/products', () => {
    test('should get all products', async () => {
      await Product.create({
        vendorId,
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

      const response = await request(app)
        .get('/api/products')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.products).toHaveLength(1);
    });
  });
});