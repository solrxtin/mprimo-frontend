// src/controllers/product.controller.ts
import { Request, Response, NextFunction } from "express";
import { ProductService } from "../services/product.service";

export const ProductController = {
  // Create new product (Vendor only)
  createProduct: async (req: Request, res: Response) => {
    try {
      // Validate category exists
      if (req.body.category?.main) {
        await CategoryService.getCategory(req.body.category.main);
      }

     

      const productData = {
        ...req.body,
        vendorId: req.userId!,
      };

      const product = await ProductService.createProduct(productData);

      res.status(201).json({ product });
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
        priceRange,
        sort,
      } = req.query;

      const query = {
        ...(category && { category }),
        ...(status && { status }),
        ...(priceRange && { priceRange }),
      };

      const sortQuery = sort ? JSON.parse(String(sort)) : undefined;

      const result = await ProductService.getProducts(
        query,
        Number(page),
        Number(limit),
        sortQuery
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await ProductService.getProductById(req.params.id);

      // Update view analytics
      await ProductService.updateAnalytics(req.params.id, "view");

      res.json({ product });
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

  static async updateInventory(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { quantity, operation } = req.body;

      const product = await ProductService.updateInventory(
        req.params.id,
        req.userId!.toString(),
        Number(quantity),
        operation as "add" | "subtract"
      );

      res.json({ product });
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
      const {
        q,
        category,
        status,
        priceRange,
        page = 1,
        limit = 10,
      } = req.query;

      const filters = {
        ...(category && { "category.main": category }),
        ...(status && { status }),
        ...(priceRange &&
          typeof priceRange === "string" && {
            "price.amount": {
              $gte: Number(priceRange.split("-")[0]),
              $lte: Number(priceRange.split("-")[1]),
            },
          }),
      };

      const results = await ProductService.searchProducts(
        String(q),
        filters,
        Number(page),
        Number(limit)
      );

      res.json(results);
    } catch (error) {
      handleError(error, res);
    }
  }
  static async addReview(req: Request, res: Response) {
    const { id } = req.params;
    const { reviewData, reviewerId } = req.body;
  
    try {
      const result = await ProductService.addReview(id, reviewData, reviewerId);
  
      res.status(201).json({
        success: true,
        message: "Review received",
        result,
      });
    } catch (error) {
      console.error("Error adding review:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  };
  static async getReviews(req: Request, res: Response) {
    const { id } = req.params;

    try {
      const reviews = await ProductService.getReviews(id);

      res.status(200).json({
        success: true,
        reviews,
      });
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  };
}