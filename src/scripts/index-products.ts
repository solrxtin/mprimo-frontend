import mongoose from 'mongoose';
import ProductModel from '../models/product.model';
import redisService from '../services/redis.service';
import dotenv from 'dotenv';

dotenv.config();

async function indexExistingProducts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('Connected to MongoDB');

    // Get all active products
    const products = await ProductModel.find({ status: 'active' }).limit(100);
    console.log(`Found ${products.length} products to index`);

    // Index each product
    for (const product of products) {
      try {
        await redisService.indexProduct(product);
        console.log(`Indexed product: ${product.name}`);
      } catch (error) {
        console.error(`Error indexing product ${product.name}:`, error);
      }
    }

    console.log('Product indexing completed');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

indexExistingProducts();