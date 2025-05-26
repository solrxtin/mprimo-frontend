import { Request, Response } from "express";
import Product from "../models/product.model";
import { LoggerService } from "../services/logger.service";
import mongoose from "mongoose";
import { CategoryService } from "../services/category.service";

const logger = LoggerService.getInstance();

// Enhanced error handling
const handleError = (error: unknown, res: Response) => {
  if (error instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(error.errors).map((err) => ({
      field: err.path,
      message: err.message,
    }));
    return res.status(400).json({ success: false, errors });
  }
  if (error instanceof mongoose.Error.CastError) {
    return res.status(400).json({
      success: false,
      message: `Invalid ${error.path}: ${error.value}`,
    });
  }
  if (error instanceof Error && "status" in error) {
    const status = (error as any).status || 500;
    return res.status(status).json({
      success: false,
      message: error.message,
    });
  }
  logger.error(
    `Server error: ${error instanceof Error ? error.message : "Unknown error"}`
  );
  res.status(500).json({ success: false, message: "Internal server error" });
};

export const ProductController = {
  // Create new product (Vendor only)
  createProduct: async (req: Request, res: Response) => {
    try {
      // Validate category exists
      if (req.body.category?.main) {
        await CategoryService.getCategory(req.body.category.main);
      }

     

      const productData = {
        name: req.body.name,
        description: req.body.description,
        category: {
          main: req.body.categoryMain,
          sub: req.body.categorySub,
        },
        price: {
          amount: req.body.priceAmount,
          currency: req.body.priceCurrency || 'USD',
        },
        inventory: {
          quantity: req.body.inventoryQuantity,
          sku: req.body.inventorySku,
          lowStockAlert: req.body.inventoryLowStockAlert,
        },
        images: req.body.images || [],
        tags: req.body.tags || [],
        status: req.body.status || 'active', 
        vendorId: req.userId,
        variants: req.body.variants || [], 

        analytics: {
          views: 0,
          purchases: 0,
          conversionRate: 0,
        },

        specifications: {
          key: req.body.specificationsKey,
          value: req.body.specificationsValue,

        },
        shipping: {
          weight: req.body.shippingWeight,
          dimensions: {
            length: req.body.shippingDimensionsLength,
            width: req.body.shippingDimensionsWidth,
            height: req.body.shippingDimensionsHeight,
          },
          restrictions: req.body.shippingRestrictions || [],
        },


      };

      const product = new Product(productData);
      await product.save();

      res.status(201).json({
        success: true,
        data: product,
        message: "Product created successfully",
      });
    } catch (error) {
      handleError(error, res);
    }
  },

  getProductsByVendor: async (req: Request, res: Response) => {
    try {
      const { 
        page = 1, 
        limit = 10,
        status,
        search
      } = req.query;

      const query: any = { 
        vendorId: req.userId // Only allow vendors to see their own products
      };

      // Add optional filters
      if (status) query.status = status;
      if (search) {
        query.$or = [
          { name: { $regex: search.toString(), $options: 'i' } },
          { description: { $regex: search.toString(), $options: 'i' } },
          { 'tags': { $regex: search.toString(), $options: 'i' } }
        ];
      }

      const products = await Product.find(query)
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .sort('-createdAt')
        .populate('category.main', 'name slug');

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
  getVendorProduct: async (req: Request, res: Response) => {
    try {
      const product = await Product.findOne({
        _id: req.params.id,
        vendorId: req.userId // Ensure product belongs to requesting vendor
      }).populate('category.main', 'name slug path');

      if (!product) {
        return res.status(404).json({ 
          success: false, 
          message: "Product not found or unauthorized" 
        });
      }

      res.status(200).json({ 
        success: true, 
        data: product 
      });
    } catch (error) {
      handleError(error, res);
    }
  },


  // Get all products (Public) with enhanced category handling
  getProducts: async (req: Request, res: Response) => {
    try {
      const {
        page = 1,
        limit = 10,
        category,
        minPrice,
        maxPrice,
        status,
        search,
        sort = "-createdAt",
      } = req.query;

      const query: any = {};

      // Build query filters
      if (category) {
        // Check if category exists
        const cat = await CategoryService.getCategory(category as string);
        query["category.main"] = cat._id;
      }

      if (status) query.status = status;
      if (minPrice || maxPrice) {
        query["price.amount"] = {};
        if (minPrice) query["price.amount"].$gte = Number(minPrice);
        if (maxPrice) query["price.amount"].$lte = Number(maxPrice);
      }
      if (search) {
        query.$or = [
          { name: { $regex: search.toString(), $options: "i" } },
          { description: { $regex: search.toString(), $options: "i" } },
          { tags: { $regex: search.toString(), $options: "i" } },
        ];
      }

      const products = await Product.find(query)
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .sort(sort.toString())
        .populate("category.main", "name slug");

      const total = await Product.countDocuments(query);

      res.status(200).json({
        success: true,
        data: products,
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / Number(limit)),
          limit: Number(limit),
        },
      });
    } catch (error) {
      handleError(error, res);
    }
  },

  // Get single product (Public) with populated category
  getProduct: async (req: Request, res: Response) => {
    try {
      const product = await Product.findById(req.params.id).populate(
        "category.main",
        "name slug path"
      );

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      // Track view (analytics)
      product.analytics.views += 1;
      await product.save();

      res.status(200).json({
        success: true,
        data: product,
      });
    } catch (error) {
      handleError(error, res);
    }
  },

  // Update product (Vendor only) with category validation
  updateProduct: async (req: Request, res: Response) => {
    try {
      // Validate category if being updated
      if (req.body.category?.main) {
        await CategoryService.getCategory(req.body.category.main);
      }

      const product = await Product.findOne({
        _id: req.params.id,
        vendorId: req.userId,
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found or unauthorized",
        });
      }

      // Prevent updating certain fields
      const { analytics, ratings, createdAt, ...updateData } = req.body;

      // Handle category update separately
      if (updateData.category) {
        product.category.main =
          updateData.category.main || product.category.main;
        product.category.sub = updateData.category.sub || product.category.sub;
        delete updateData.category;
      }

      Object.assign(product, updateData);
      await product.save();

      res.status(200).json({
        success: true,
        data: product,
        message: "Product updated successfully",
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
          vendorId: req.userId,
        },
        {
          $set: {
            "inventory.quantity": quantity,
            ...(sku && { "inventory.sku": sku }),
            ...(lowStockAlert && { "inventory.lowStockAlert": lowStockAlert }),
          },
        },
        { new: true, runValidators: true }
      );

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found or unauthorized",
        });
      }

      // Update status if needed
      if (quantity <= 0 && product.status !== "outOfStock") {
        product.status = "outOfStock";
        await product.save();
      } else if (quantity > 0 && product.status === "outOfStock") {
        product.status = "active";
        await product.save();
      }

      res.status(200).json({
        success: true,
        data: product.inventory,
        message: "Inventory updated successfully",
      });
    } catch (error) {
      handleError(error, res);
    }
  },

  // Get products by category (Public)
  getProductsByCategory: async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const { page = 1, limit = 10 } = req.query;

      // Get category by slug
      const category = await CategoryService.getCategoryBySlug(slug);

      // Find all products in this category and its subcategories
      const query = {
        "category.main": category._id,
        status: "active",
      };

      const products = await Product.find(query)
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .sort("-createdAt")
        .populate("category.main", "name slug");

      const total = await Product.countDocuments(query);

      res.status(200).json({
        success: true,
        data: products,
        category: {
          name: category.name,
          slug: category.slug,
          description: category.description,
        },
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / Number(limit)),
          limit: Number(limit),
        },
      });
    } catch (error) {
      handleError(error, res);
    }
  },

  // Other existing methods (updateVariant, updateStatus, deleteProduct) remain the same
  // ...
  // Delete product (Vendor only)
  deleteProduct: async (req: Request, res: Response) => {
    try {
      const product = await Product.findOneAndDelete({
        _id: req.params.id,
        vendorId: req.userId,
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found or unauthorized",
        });
      }

      res.status(200).json({
        success: true,
        message: "Product deleted successfully",
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
              "variants.$[elem].name": name,
              "variants.$[elem].options": options,
            },
          }
        : {
            $push: {
              variants: { name, options },
            },
          };

      const product = (await Product.findOneAndUpdate(
        {
          _id: req.params.id,
          vendorId: req.userId,
        },
        updateQuery,
        {
          new: true,
          runValidators: true,
          ...(variantId && {
            arrayFilters: [{ "elem._id": variantId }],
          }),
        }
      )) as unknown as Product | null;

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found or unauthorized",
        });
      }

      res.status(200).json({
        success: true,
        data: product?.variants,
        message: variantId ? "Variant updated" : "Variant added",
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
          vendorId: req.userId,
        },
        { status },
        { new: true }
      );

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found or unauthorized",
        });
      }

      res.status(200).json({
        success: true,
        data: { status: product.status },
        message: "Status updated successfully",
      });
    } catch (error) {
      handleError(error, res);
    }
  },
};
