import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { ProductService } from '../../services/product.service';
import Product from '../../models/product.model';

describe('Product Service', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Product.deleteMany({});
  });

  describe('createProduct', () => {
    test('should create a new product', async () => {
      const productData = {
        vendorId: new mongoose.Types.ObjectId(),
        name: 'Test Product',
        description: 'Test Description',
        brand: 'Test Brand',
        condition: 'new' as const,
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
          unit: 'kg' as const,
          dimensions: { length: 10, width: 10, height: 10 }
        }
      };

      const product = await ProductService.createProduct(productData);

      expect(product.name).toBe(productData.name);
      expect(product.brand).toBe(productData.brand);
      expect(product.variants).toHaveLength(1);
    });
  });

  describe('getProducts', () => {
    test('should get products with pagination', async () => {
      await Product.create({
        vendorId: new mongoose.Types.ObjectId(),
        name: 'Test Product 1',
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

      const result = await ProductService.getProducts({}, 1, 10);

      expect(result.products).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
    });
  });

  describe('updateProduct', () => {
    test('should update product', async () => {
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

      const updatedProduct = await ProductService.updateProduct(
        product._id.toString(),
        product.vendorId,
        { name: 'Updated Product' }
      );

      expect(updatedProduct.name).toBe('Updated Product');
    });
  });

  describe('deleteProduct', () => {
    test('should delete product', async () => {
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

      const deletedProduct = await ProductService.deleteProduct(
        product._id.toString(),
        product.vendorId
      );

      expect(deletedProduct._id.toString()).toBe(product._id.toString());

      const foundProduct = await Product.findById(product._id);
      expect(foundProduct).toBeNull();
    });
  });
});