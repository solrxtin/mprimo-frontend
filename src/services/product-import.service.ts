import csv from 'csv-parser';
import { Readable } from 'stream';
import Product from '../models/product.model';
import Category from '../models/category.model';
import Country from '../models/country.model';
import Vendor from '../models/vendor.model';
import { LoggerService } from './logger.service';
import axios from 'axios';


const logger = LoggerService.getInstance();

interface ImportResult {
  success: boolean;
  productId?: string;
  error?: string;
  data?: any;
}

interface ProductImportData {
  name: string;
  brand: string;
  description: string;
  condition: 'new' | 'used' | 'refurbished';
  category: string; // "Electronics > Smartphones"
  images: string[];
  variants: Array<{
    name: string;
    options: Array<{
      value: string;
      price: number;
      quantity: number;
      sku?: string;
    }>;
  }>;
  specifications: Array<{
    key: string;
    value: string;
  }>;
  shipping: {
    weight: number;
    dimensions?: {
      length: number;
      width: number;
      height: number;
    };
  };
}

export class ProductImportService {
  static async importFromCSV(
    fileBuffer: Buffer,
    vendorId: string
  ): Promise<{ results: ImportResult[]; summary: any }> {
    const results: ImportResult[] = [];
    const products: any[] = [];

    return new Promise((resolve) => {
      const stream = Readable.from(fileBuffer);
      
      stream
        .pipe(csv())
        .on('data', (row: any) => {
          products.push(row);
        })
        .on('end', async () => {
          for (const productData of products) {
            const result = await this.createProductFromData(productData, vendorId);
            results.push(result);
          }

          const summary = {
            total: results.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length
          };

          resolve({ results, summary });
        });
    });
  }

  static async importFromJSON(
    products: ProductImportData[],
    vendorId: string
  ): Promise<{ results: ImportResult[]; summary: any }> {
    const results: ImportResult[] = [];

    for (const productData of products) {
      const result = await this.createProductFromData(productData, vendorId);
      results.push(result);
    }

    const summary = {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    };

    return { results, summary };
  }

  static async importFromShopify(
    apiKey: string,
    storeUrl: string,
    vendorId: string
  ): Promise<{ results: ImportResult[]; summary: any }> {
    try {
      const response = await axios.get(`https://${storeUrl}/admin/api/2023-10/products.json`, {
        headers: {
          'X-Shopify-Access-Token': apiKey
        }
      });

      const shopifyProducts = response.data.products;
      const results: ImportResult[] = [];

      for (const shopifyProduct of shopifyProducts) {
        const productData = this.mapShopifyProduct(shopifyProduct);
        const result = await this.createProductFromData(productData, vendorId);
        results.push(result);
      }

      const summary = {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      };

      return { results, summary };
    } catch (error) {
      logger.error('Shopify import error:', error);
      throw new Error('Failed to import from Shopify');
    }
  }

  static async importFromWooCommerce(
    apiKey: string,
    apiSecret: string,
    storeUrl: string,
    vendorId: string
  ): Promise<{ results: ImportResult[]; summary: any }> {
    try {
      const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
      const response = await axios.get(`${storeUrl}/wp-json/wc/v3/products`, {
        headers: {
          'Authorization': `Basic ${auth}`
        }
      });

      const wooProducts = response.data;
      const results: ImportResult[] = [];

      for (const wooProduct of wooProducts) {
        const productData = this.mapWooCommerceProduct(wooProduct);
        const result = await this.createProductFromData(productData, vendorId);
        results.push(result);
      }

      const summary = {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      };

      return { results, summary };
    } catch (error) {
      logger.error('WooCommerce import error:', error);
      throw new Error('Failed to import from WooCommerce');
    }
  }

  private static async createProductFromData(
    data: any,
    vendorId: string
  ): Promise<ImportResult> {
    try {
      // Get vendor info
      const vendor = await Vendor.findById(vendorId).populate('userId');
      if (!vendor) {
        return { success: false, error: 'Vendor not found', data };
      }

      // Find category
      const categoryPath = data.category?.split(' > ') || ['General'];
      const category = await Category.findOne({ 
        name: { $regex: categoryPath[0], $options: 'i' } 
      });
      
      if (!category) {
        return { success: false, error: 'Category not found', data };
      }

      // Get country
      const country = await Country.findOne({ 
        name: vendor.businessInfo?.address?.country 
      });
      
      if (!country) {
        return { success: false, error: 'Country not found', data };
      }

      // Create variants if not provided
      let variants = data.variants || [];
      if (variants.length === 0) {
        variants = [{
          name: 'Default',
          isDefault: true,
          options: [{
            value: 'Standard',
            price: data.price || 0,
            quantity: data.quantity || 0,
            sku: data.sku || `${data.name?.replace(/\s+/g, '-').toUpperCase()}-001`,
            isDefault: true
          }]
        }];
      }

      // Ensure at least one variant and option is marked as default
      if (variants.length > 0) {
        variants[0].isDefault = true;
        if (variants[0].options?.length > 0) {
          variants[0].options[0].isDefault = true;
        }
      }

      const product = await Product.create({
        vendorId,
        name: data.name,
        brand: data.brand || 'Unknown',
        description: data.description || 'No description provided',
        condition: data.condition || 'new',
        category: {
          main: category._id,
          sub: [],
          path: categoryPath
        },
        country: country._id,
        inventory: {
          lowStockAlert: 5,
          listing: {
            type: 'instant',
            instant: {
              acceptOffer: false
            }
          }
        },
        images: data.images || ['https://via.placeholder.com/400x400?text=No+Image'],
        specifications: data.specifications || [],
        shipping: {
          weight: data.shipping?.weight || 1,
          unit: 'kg',
          dimensions: data.shipping?.dimensions || {
            length: 10,
            width: 10,
            height: 5
          },
          restrictions: ['none']
        },
        variants,
        status: 'active',
        reviews: [],
        rating: 0,
        analytics: {
          views: 0,
          addToCart: 0,
          wishlist: 0,
          purchases: 0,
          conversionRate: 0
        },
        offers: [],
        bids: []
      });

      return { 
        success: true, 
        productId: product._id.toString(),
        data: { name: product.name, sku: variants[0]?.options[0]?.sku }
      };

    } catch (error) {
      logger.error('Product creation error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        data 
      };
    }
  }

  private static mapShopifyProduct(shopifyProduct: any): ProductImportData {
    return {
      name: shopifyProduct.title,
      brand: shopifyProduct.vendor || 'Unknown',
      description: shopifyProduct.body_html?.replace(/<[^>]*>/g, '') || '',
      condition: 'new',
      category: shopifyProduct.product_type || 'General',
      images: shopifyProduct.images?.map((img: any) => img.src) || [],
      variants: shopifyProduct.variants?.map((variant: any) => ({
        name: variant.option1 ? 'Variant' : 'Default',
        options: [{
          value: variant.title,
          price: parseFloat(variant.price),
          quantity: variant.inventory_quantity || 0,
          sku: variant.sku
        }]
      })) || [],
      specifications: [],
      shipping: {
        weight: parseFloat(shopifyProduct.variants?.[0]?.weight) || 1
      }
    };
  }

  private static mapWooCommerceProduct(wooProduct: any): ProductImportData {
    return {
      name: wooProduct.name,
      brand: wooProduct.brands?.[0]?.name || 'Unknown',
      description: wooProduct.description?.replace(/<[^>]*>/g, '') || '',
      condition: 'new',
      category: wooProduct.categories?.[0]?.name || 'General',
      images: wooProduct.images?.map((img: any) => img.src) || [],
      variants: wooProduct.variations?.length > 0 ? [{
        name: 'Variant',
        options: wooProduct.variations.map((variant: any) => ({
          value: variant.attributes?.[0]?.option || 'Standard',
          price: parseFloat(variant.price),
          quantity: variant.stock_quantity || 0,
          sku: variant.sku
        }))
      }] : [],
      specifications: wooProduct.attributes?.map((attr: any) => ({
        key: attr.name,
        value: attr.options?.join(', ') || ''
      })) || [],
      shipping: {
        weight: parseFloat(wooProduct.weight) || 1,
        dimensions: {
          length: parseFloat(wooProduct.dimensions?.length) || 10,
          width: parseFloat(wooProduct.dimensions?.width) || 10,
          height: parseFloat(wooProduct.dimensions?.height) || 5
        }
      }
    };
  }
}