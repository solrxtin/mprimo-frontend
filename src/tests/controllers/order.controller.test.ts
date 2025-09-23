import request from 'supertest';
import express from 'express';
import {
  getAllOrders,
  getOrder,
  makeOrder,
  cancelOrder,
  refundOrder,
  getRefunds,
  getOrderStats,
  OrderController,
} from "../../controllers/order.controller";
import Order from '../../models/order.model';
import ProductModel from '../../models/product.model';

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  req.user = { id: 'mock-user-id', role: 'user' };
  next();
});

app.post('/orders', makeOrder);
app.get('/orders', getAllOrders);
app.get('/orders/:id', getOrder);
app.patch('/orders/:id/status', OrderController.updateOrderStatus);
app.post('/orders/:id/cancel', cancelOrder);

describe('Order Controller', () => {
  let productId: string;
  let orderId: string;

  beforeEach(async () => {
    const product = await ProductModel.create({
      name: 'Test Product',
      slug: 'test-product',
      description: 'Test description',
      price: { amount: 100, currency: 'USD' },
      vendor: 'mock-vendor-id',
      inventory: { quantity: 10 },
      status: 'active'
    });
    productId = product._id.toString();

    const order = await Order.create({
      userId: 'mock-user-id',
      items: [{
        productId,
        quantity: 2,
        price: 100,
        total: 200
      }],
      totalAmount: 200,
      currency: 'USD',
      status: 'pending',
      shippingAddress: {
        street: '123 Main St',
        city: 'Test City',
        state: 'Test State',
        zipCode: '12345',
        country: 'Test Country'
      }
    });
    orderId = order._id.toString();
  });

  describe('POST /orders', () => {
    it('should create a new order', async () => {
      const orderData = {
        items: [{
          productId,
          quantity: 1,
          price: 100
        }],
        shippingAddress: {
          street: '456 Oak St',
          city: 'Test City',
          state: 'Test State',
          zipCode: '12345',
          country: 'Test Country'
        },
        paymentMethod: 'stripe'
      };

      const response = await request(app)
        .post('/orders')
        .send(orderData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('pending');
    });

    it('should return error for invalid order data', async () => {
      const response = await request(app)
        .post('/orders')
        .send({ items: [] })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /orders', () => {
    it('should get user orders', async () => {
      const response = await request(app)
        .get('/orders')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.orders).toHaveLength(1);
    });

    it('should filter orders by status', async () => {
      const response = await request(app)
        .get('/orders')
        .query({ status: 'pending' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.orders).toHaveLength(1);
    });
  });

  describe('GET /orders/:id', () => {
    it('should get order by id', async () => {
      const response = await request(app)
        .get(`/orders/${orderId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalAmount).toBe(200);
    });

    it('should return 404 for non-existent order', async () => {
      const response = await request(app)
        .get('/orders/507f1f77bcf86cd799439011')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /orders/:id/status', () => {
    it('should update order status', async () => {
      const response = await request(app)
        .patch(`/orders/${orderId}/status`)
        .send({ status: 'confirmed' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('confirmed');
    });
  });

  describe('POST /orders/:id/cancel', () => {
    it('should cancel order', async () => {
      const response = await request(app)
        .post(`/orders/${orderId}/cancel`)
        .send({ reason: 'Changed mind' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('cancelled');
    });
  });
});