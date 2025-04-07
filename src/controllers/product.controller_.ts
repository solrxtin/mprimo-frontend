import { Request, Response } from "express";
import Product from "../models/product.model";
import { LoggerService } from "../services/logger.service";
import mongoose from "mongoose";

const logger = LoggerService.getInstance();

// Helper function for error handling
const handleError = (error: unknown, res: Response) => {
  if (error instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(error.errors).map(err => ({
      field: err.path,
      message: err.message
    }));
    return res.status(400).json({ success: false, errors });
  }
  if (error instanceof mongoose.Error.CastError) {
    return res.status(400).json({ 
      success: false, 
      message: `Invalid ${error.path}: ${error.value}`
    });
  }
  logger.error(`Server error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  res.status(500).json({ success: false, message: "Internal server error" });
};

export const productController = {
  // Create new product (Vendor only)
  createProduct: async (req: Request, res: Response) => {
    try {
      // Add vendorId from authenticated user
      const productData = { ...req.body, vendorId: req.userId };
      const product = new Product(productData);
      await product.save();

      res.status(201).json({ 
        success: true, 
        data: product,
        message: "Product created successfully"
      });
    } catch (error) {
      handleError(error, res);
    }
  },

  // Get all products (Public)
  getProducts: async (req: Request, res: Response) => {
    try {
      const { 
        page = 1, 
        limit = 10, 
        category, 
        minPrice, 
        maxPrice, 
        status,
        search
      } = req.query;

      const query: any = {};
      
      // Build query filters
      if (category) query['category.main'] = category;
      if (status) query.status = status;
      if (minPrice || maxPrice) {
        query['price.amount'] = {};
        if (minPrice) query['price.amount'].$gte = Number(minPrice);
        if (maxPrice) query['price.amount'].$lte = Number(maxPrice);
      }
      if (search) {
        query.$text = { $search: search.toString() };
      }

      const products = await Product.find(query)
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .sort({ createdAt: -1 });

      const total = await Product.countDocuments(query);

      res.status(200).json({
        success: true,
        data: products,
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / Number(limit)),
          limit: Number(limit)
        }
      });
    } catch (error) {
      handleError(error, res);
    }
  },

  // Get single product (Public)
  getProduct: async (req: Request, res: Response) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) {
        return res.status(404).json({ 
          success: false, 
          message: "Product not found" 
        });
      }

      // Track view (analytics)
      product.analytics.views += 1;
      await product.save();

      res.status(200).json({ 
        success: true, 
        data: product 
      });
    } catch (error) {
      handleError(error, res);
    }
  },

  // Update product (Vendor only)
  updateProduct: async (req: Request, res: Response) => {
    try {
      // Verify product belongs to requesting vendor
      const product = await Product.findOne({
        _id: req.params.id,
        vendorId: req.userId
      });

      if (!product) {
        return res.status(404).json({ 
          success: false, 
          message: "Product not found or unauthorized" 
        });
      }

      // Prevent updating certain fields
      const { analytics, ratings, createdAt, ...updateData } = req.body;
      
      Object.assign(product, updateData);
      await product.save();

      res.status(200).json({ 
        success: true, 
        data: product,
        message: "Product updated successfully"
      });
    } catch (error) {
      handleError(error, res);
    }
  },

  // Update inventory (Vendor only)
  updateInventory: async (req: Request, res: Response) => {
    try {
      const { quantity, sku, lowStockAlert } = req.body;
      
      const product = await Product.findOneAndUpdate(
        { 
          _id: req.params.id,
          vendorId: req.userId 
        },
        { 
          $set: { 
            'inventory.quantity': quantity,
            ...(sku && { 'inventory.sku': sku }),
            ...(lowStockAlert && { 'inventory.lowStockAlert': lowStockAlert })
          } 
        },
        { new: true, runValidators: true }
      );

      if (!product) {
        return res.status(404).json({ 
          success: false, 
          message: "Product not found or unauthorized" 
        });
      }

      // Update status if needed
      if (quantity <= 0 && product.status !== 'outOfStock') {
        product.status = 'outOfStock';
        await product.save();
      } else if (quantity > 0 && product.status === 'outOfStock') {
        product.status = 'active';
        await product.save();
      }

      res.status(200).json({ 
        success: true, 
        data: product.inventory,
        message: "Inventory updated successfully"
      });
    } catch (error) {
      handleError(error, res);
    }
  },

  // Add/update variant (Vendor only)
  updateVariant: async (req: Request, res: Response) => {
    try {
      const { variantId, name, options } = req.body;
      
      const updateQuery = variantId 
        ? { 
            $set: { 
              'variants.$[elem].name': name,
              'variants.$[elem].options': options
            } 
          }
        : { 
            $push: { 
              variants: { name, options } 
            } 
          };

      const product = await Product.findOneAndUpdate(
        { 
          _id: req.params.id,
          vendorId: req.userId 
        },
        updateQuery,
        {
          new: true,
          runValidators: true,
          ...(variantId && {
            arrayFilters: [{ 'elem._id': variantId }]
          })
        }
      ) as unknown as Product | null;

      if (!product) {
        return res.status(404).json({ 
          success: false, 
          message: "Product not found or unauthorized" 
        });
      }

      res.status(200).json({ 
        success: true, 
        data: product?.variants,
        message: variantId ? "Variant updated" : "Variant added"
      });
    } catch (error) {
      handleError(error, res);
    }
  },

  // Update product status (Vendor/Admin)
  updateStatus: async (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      
      const product = await Product.findOneAndUpdate(
        { 
          _id: req.params.id,
           vendorId: req.userId 
        },
        { status },
        { new: true }
      );

      if (!product) {
        return res.status(404).json({ 
          success: false, 
          message: "Product not found or unauthorized" 
        });
      }

      res.status(200).json({ 
        success: true, 
        data: { status: product.status },
        message: "Status updated successfully"
      });
    } catch (error) {
      handleError(error, res);
    }
  },

  // Delete product (Vendor only)
  deleteProduct: async (req: Request, res: Response) => {
    try {
      const product = await Product.findOneAndDelete({
        _id: req.params.id,
        vendorId: req.userId
      });

      if (!product) {
        return res.status(404).json({ 
          success: false, 
          message: "Product not found or unauthorized" 
        });
      }

      res.status(200).json({ 
        success: true, 
        message: "Product deleted successfully" 
      });
    } catch (error) {
      handleError(error, res);
    }
  }
};