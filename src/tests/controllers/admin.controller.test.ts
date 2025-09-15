import request from 'supertest';
import express from 'express';
import { VenodrManagenentController } from '../../controllers/admin.controller';
import User from '../../models/user.model';
import ProductModel from '../../models/product.model';

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  req.user = { id: 'mock-admin-id', role: 'admin' };
  next();
});

app.get('/admin/users', VenodrManagenentController.getAllUsers);
app.get('/admin/users/:id', VenodrManagenentController.getUserById);
app.put('/admin/users/:id', VenodrManagenentController.updateUser);
app.delete('/admin/users/:id', VenodrManagenentController.deleteUser);
app.get('/admin/orders', VenodrManagenentController.getAllOrders);
app.get('/admin/analytics', VenodrManagenentController.getOrderStats);

describe('Admin Controller', () => {
  let userId: string;
  let productId: string;

  beforeEach(async () => {
    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashed-password',
      role: 'user',
      isEmailVerified: true
    });
    userId = user._id.toString();

    const product = await ProductModel.create({
      name: 'Test Product',
      slug: 'test-product',
      description: 'Test description',
      price: { amount: 100, currency: 'USD' },
      vendor: userId,
      inventory: { quantity: 10 },
      status: 'pending'
    });
    productId = product._id.toString();
  });

  describe('GET /admin/users', () => {
    it('should get all users', async () => {
      const response = await request(app)
        .get('/admin/users')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toHaveLength(1);
    });

    it('should filter users by role', async () => {
      const response = await request(app)
        .get('/admin/users')
        .query({ role: 'user' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toHaveLength(1);
    });

    it('should search users by name', async () => {
      const response = await request(app)
        .get('/admin/users')
        .query({ search: 'Test' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toHaveLength(1);
    });
  });

  describe('GET /admin/users/:id', () => {
    it('should get user by id', async () => {
      const response = await request(app)
        .get(`/admin/users/${userId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('test@example.com');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/admin/users/507f1f77bcf86cd799439011')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /admin/users/:id', () => {
    it('should update user', async () => {
      const updateData = {
        name: 'Updated Name',
        role: 'business'
      };

      const response = await request(app)
        .put(`/admin/users/${userId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Name');
    });
  });

  describe('DELETE /admin/users/:id', () => {
    it('should delete user', async () => {
      const response = await request(app)
        .delete(`/admin/users/${userId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /admin/orders', () => {
    it('should get all orders', async () => {
      const response = await request(app)
        .get('/admin/orders')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.orders).toBeDefined();
    });

    it('should filter orders by status', async () => {
      const response = await request(app)
        .get('/admin/orders')
        .query({ status: 'pending' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.orders).toBeDefined();
    });
  });

  describe('GET /admin/analytics', () => {
    it('should get order statistics', async () => {
      const response = await request(app)
        .get('/admin/analytics')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });
});