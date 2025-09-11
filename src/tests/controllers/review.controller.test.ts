import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import Product from '../../models/product.model';
import User from '../../models/user.model';
import jwt from 'jsonwebtoken';

describe('Review Controller', () => {
  let mongoServer: MongoMemoryServer;
  let app: any;
  let userToken: string;
  let productId: string;
  let reviewId: string;

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
      },
      reviews: [{
        userId: user._id,
        rating: 5,
        comment: 'Great product!',
        helpful: []
      }]
    });

    productId = product._id.toString();
    reviewId = product.reviews[0]._id.toString();
    userToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe('PATCH /api/reviews/product/:productId/review/:reviewId/helpful', () => {
    test('should toggle helpful on review', async () => {
      const response = await request(app)
        .patch(`/api/reviews/product/${productId}/review/${reviewId}/helpful`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.helpful).toBe(true);
      expect(response.body.helpfulCount).toBe(1);
    });
  });

  describe('GET /api/reviews/product/:productId/analytics', () => {
    test('should get product review analytics', async () => {
      const response = await request(app)
        .get(`/api/reviews/product/${productId}/analytics`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.analytics).toBeDefined();
      expect(response.body.analytics.averageRating).toBeDefined();
      expect(response.body.analytics.totalReviews).toBeDefined();
    });
  });
});