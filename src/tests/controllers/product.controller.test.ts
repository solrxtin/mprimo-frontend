import request from 'supertest';
import express from 'express';
import { ProductController } from '../../controllers/product.controller';
import ProductModel from '../../models/product.model';
import Category from '../../models/category.model';

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  req.user = { id: 'mock-user-id', role: 'business' };
  next();
});

app.get('/products', ProductController.getProducts);
app.post('/products', ProductController.createProduct);
app.get('/products/:id', ProductController.getProduct);
app.put('/products/:id', ProductController.updateProduct);
app.delete('/products/:id', ProductController.deleteProduct);
app.get('/products/search', ProductController.searchProducts);
app.post('/products/:id/reviews', ProductController.addReview);

describe('Product Controller', () => {
  let categoryId: string;
  let productId: string;

  beforeEach(async () => {
    const category = await Category.create({
      name: 'Electronics',
      slug: 'electronics',
      description: 'Electronic items'
    });
    categoryId = category._id.toString();

    const product = await ProductModel.create({
      name: 'Test Product',
      slug: 'test-product',
      description: 'Test description',
      price: { amount: 100, currency: 'USD' },
      category: { main: categoryId },
      vendor: 'mock-user-id',
      inventory: { quantity: 10 },
      status: 'active'
    });
    productId = product._id.toString();
  });

  describe('GET /products', () => {
    it('should get all products', async () => {
      const response = await request(app)
        .get('/products')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(1);
    });

    it('should filter products by category', async () => {
      const response = await request(app)
        .get('/products')
        .query({ category: categoryId })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(1);
    });
  });

  describe('POST /products', () => {
    it('should create a new product', async () => {
      const productData = {
        name: 'New Product',
        description: 'New description',
        price: { amount: 200, currency: 'USD' },
        category: { main: categoryId },
        inventory: { quantity: 5 }
      };

      const response = await request(app)
        .post('/products')
        .send(productData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('New Product');
    });

    it('should return error for invalid data', async () => {
      const response = await request(app)
        .post('/products')
        .send({ name: 'Invalid' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /products/:id', () => {
    it('should get product by id', async () => {
      const response = await request(app)
        .get(`/products/${productId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Test Product');
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .get('/products/507f1f77bcf86cd799439011')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /products/:id', () => {
    it('should update product', async () => {
      const updateData = { name: 'Updated Product' };

      const response = await request(app)
        .put(`/products/${productId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Product');
    });
  });

  describe('DELETE /products/:id', () => {
    it('should delete product', async () => {
      const response = await request(app)
        .delete(`/products/${productId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /products/:id/reviews', () => {
    it('should add review to product', async () => {
      const reviewData = {
        rating: 5,
        comment: 'Great product!'
      };

      const response = await request(app)
        .post(`/products/${productId}/reviews`)
        .send(reviewData)
        .expect(201);

      expect(response.body.success).toBe(true);
    });
  });
});