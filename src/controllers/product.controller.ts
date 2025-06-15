// src/controllers/product.controller.ts
import { Request, Response, NextFunction } from "express";
import { ProductService } from "../services/product.service";
import ProductModel from "../models/product.model";
import redisService from "../services/redis.service";
import User from "../models/user.model";
import Vendor from "../models/vendor.model";
import { validateProductData } from "../utils/validate-create-product";

export class ProductController {
  static async createProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const supposedVendor = await Vendor.findOne({ userId: req.userId });
      const result = await validateProductData(req.body);

      if (!result.valid) {
        res.status(400).json({
          success: false,
          message: result.error,
        });
        return;
      }

      const productData = {
        ...req.body,
        vendorId: supposedVendor!._id,
      };
      const savedProduct = await ProductModel.create(productData);

      // Index product for search suggestions
      await redisService.indexProduct(savedProduct);
      const product = await ProductModel.findById(savedProduct._id)
        .populate({
          path: "vendorId",
          select: "accountType businessInfo sellingLimits ratings analytics",
          populate: {
            path: "userId",
            select: "email profile role",
          },
        })
        .populate({
          path: "country",
          select: "name currency",
        })
        .populate("category.main", "name slug")
        .populate("category.sub", "name slug");
      res
        .status(201)
        .json({
          product,
          success: true,
          message: "Product created successfully",
        });
    } catch (error) {
      next(error);
    }
  }

  static async getProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        page = 1,
        limit = 10,
        category,
        status,
        priceRange,
        sort,
      } = req.query;

      const query = {
        ...(category && { "category.main": category }),
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

  static async getVendorProducts(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { vendorId } = req.params;
      if (!vendorId) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }
      const vendorProducts = await ProductService.getProductsByVendorId(
        vendorId
      );
      res.json({
        success: true,
        products: vendorProducts,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getProduct(req: Request, res: Response, next: NextFunction) {
    try {
      // Use Redis cache for product data if available
      let product;
      try {
        product = await redisService.getProductWithCache(req.params.id);
      } catch (error) {
        // Fallback to database if Redis fails
        product = await ProductService.getProductById(req.params.id);
      }

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      // Track view asynchronously without waiting for result
      try {
        await redisService.trackEvent(req.params.id, "view", req.userId!);
      } catch (error) {
        console.error("Error tracking view:", error);
      }

      res.json({ product });
    } catch (error) {
      next(error);
    }
  }

  static async updateProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const vendor = await Vendor.findOne({ userId: req.userId });
      if (!vendor) {
        throw new Error("Unauthorized");
      }
      const product = await ProductService.updateProduct(
        req.params.id,
        vendor._id,
        req.body
      );

      // Invalidate cache after update
      try {
        await redisService.invalidateProductCache(req.params.id);
      } catch (error) {
        console.error("Error invalidating cache:", error);
      }

      res.json({ product });
    } catch (error) {
      next(error);
    }
  }

  static async deleteProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const vendor = await Vendor.findOne({ userId: req.userId });
      if (!vendor) {
        throw new Error("Unauthorized");
      }

      await ProductService.deleteProduct(req.params.id, vendor._id);

      // Invalidate cache after delete
      try {
        await redisService.invalidateProductCache(req.params.id);
      } catch (error) {
        console.error("Error invalidating cache:", error);
      }

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  static async updateInventory(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { quantity, operation } = req.body;
      const productId = req.params.id;
      const userId = req.userId!;

      const product = await ProductService.updateInventory(
        productId,
        userId,
        Number(quantity),
        operation as "add" | "subtract"
      );

      // Update inventory in Redis
      try {
        const change =
          operation === "add" ? Number(quantity) : -Number(quantity);
        await redisService.updateInventory(productId, change);

        // Invalidate product cache
        await redisService.invalidateProductCache(productId);
      } catch (error) {
        console.error("Error updating Redis inventory:", error);
      }

      res.json({ product });
    } catch (error) {
      next(error);
    }
  }

  static async addVariant(req: Request, res: Response, next: NextFunction) {
    try {
      const vendor = await Vendor.findOne({ userId: req.userId });
      if (!vendor) {
        throw new Error("Unauthorized");
      }
      const product = await ProductService.addVariant(
        req.params.id,
        vendor._id,
        req.body
      );

      // Invalidate cache after update
      try {
        await redisService.invalidateProductCache(req.params.id);
      } catch (error) {
        console.error("Error invalidating cache:", error);
      }

      res.json({ product });
    } catch (error) {
      next(error);
    }
  }

  static async searchProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        q,
        category,
        status,
        priceRange,
        page = 1,
        limit = 10,
      } = req.query;

      let suggestions: string[] = [];
      // Get search suggestions if query is short
      if (q && typeof q === "string" && q.length < 10) {
        try {
          suggestions = await redisService.getSuggestions(q.toLowerCase());
        } catch (error) {
          console.error("Error getting suggestions:", error);
        }
      }

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

      // Return results with suggestions
      return res.json({
        ...results,
        suggestions,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getProductsByCategory(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { categoryId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const results = await ProductService.getProductsByCategory(
        categoryId,
        page,
        limit
      );

      res.json(results);
    } catch (error) {
      next(error);
    }
  }

  static async addReview(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { rating, comment } = req.body;
      const userId = req.userId;

      const reviewData = {
        userId,
        rating,
        comment,
        createdAt: new Date(),
      };

      const result = await ProductService.addReview(id, reviewData, userId);

      // Invalidate product cache after adding review
      try {
        await redisService.invalidateProductCache(id);
      } catch (error) {
        console.error("Error invalidating cache:", error);
      }

      res.status(201).json({
        success: true,
        message: "Review added successfully",
        product: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const reviews = await ProductService.getReviews(id);

      res.json({
        success: true,
        reviews,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTopProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const count = parseInt(req.query.count as string) || 10;

      // Get top products from Redis
      let topProducts: Array<string | [string, string]> = [];
      try {
        topProducts = await redisService.getTopProducts(count);
      } catch (error) {
        console.error("Error getting top products from Redis:", error);
      }

      // If Redis has data, return it
      if (topProducts && topProducts.length > 0) {
        // Extract product IDs
        const productIds = topProducts.map((item) =>
          typeof item === "string" ? item : item[0]
        );

        // Fetch full product details
        const products = await ProductService.getProductsByIds(productIds);

        return res.json({
          success: true,
          products,
        });
      }

      // Fallback to database if Redis doesn't have data
      const products = await ProductService.getTopProducts(count);

      res.json({
        success: true,
        products,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getRelatedProducts(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;
      const count = parseInt(req.query.count as string) || 5;

      // Get related products from Redis
      let relatedIds: string[] = [];
      try {
        relatedIds = await redisService.getRelatedProducts(id, count);
      } catch (error) {
        console.error("Error getting related products from Redis:", error);
      }

      // If Redis has data, return it
      if (relatedIds && relatedIds.length > 0) {
        const products = await ProductService.getProductsByIds(relatedIds);

        return res.json({
          success: true,
          products,
        });
      }

      // Fallback to database if Redis doesn't have data
      const products = await ProductService.getSimilarProducts(id, count);

      res.json({
        success: true,
        products,
      });
    } catch (error) {
      next(error);
    }
  }

  static async trackProductEvent(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id, eventType } = req.params;
      const userId = req.userId || null;

      if (!["view", "click", "addToCart", "purchase"].includes(eventType)) {
        return res.status(400).json({
          success: false,
          message: "Invalid event type",
        });
      }

      // Track event in Redis
      try {
        await redisService.trackEvent(
          id,
          eventType as "view" | "click" | "addToCart" | "purchase",
          userId,
          req.body.amount
        );
      } catch (error) {
        console.error("Error tracking event in Redis:", error);
        // Fallback to direct database update
        if (eventType === "view" || eventType === "purchase") {
          await ProductService.updateAnalytics(
            id,
            eventType as "view" | "purchase"
          );
        }
      }

      res.status(200).json({
        success: true,
        message: `${eventType} event tracked`,
      });
    } catch (error) {
      next(error);
    }
  }

  static async saveDraft(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;
      const draftData = req.body;

      console.log("Draft data is: ", draftData);

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const result = await ProductService.saveDraft(draftData, userId);

      res.status(201).json({
        success: true,
        message: "Draft saved successfully",
        draft: result,
      });
    } catch (error) {
      console.error("Error saving draft:", error);
      res.status(500).json({
        success: false,
        message: "Failed to save draft",
      });
    }
  }

  static async getDrafts(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const drafts = await ProductService.getDrafts(userId);

      res.status(200).json({
        success: true,
        drafts,
      });
    } catch (error) {
      console.error("Error getting drafts:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get drafts",
      });
    }
  }

  static async updateDraft(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;
      const draftId = req.params.id;
      const draftData = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const result = await ProductService.updateDraft(
        draftId,
        draftData,
        userId
      );

      if (!result) {
        return res.status(404).json({
          success: false,
          message: "Draft not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Draft updated successfully",
        draft: result,
      });
    } catch (error) {
      console.error("Error updating draft:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update draft",
      });
    }
  }

  static async deleteDraft(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;
      const draftId = req.params.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const result = await ProductService.deleteDraft(draftId, userId);

      if (!result) {
        return res.status(404).json({
          success: false,
          message: "Draft not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Draft deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting draft:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete draft",
      });
    }
  }

  static async checkout(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const { items, shippingAddress, paymentMethod } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Items are required",
        });
      }

      if (!shippingAddress) {
        return res.status(400).json({
          success: false,
          message: "Shipping address is required",
        });
      }

      if (!paymentMethod) {
        return res.status(400).json({
          success: false,
          message: "Payment method is required",
        });
      }

      // Process checkout
      const order = await ProductService.createOrder(
        userId,
        items,
        shippingAddress,
        paymentMethod
      );

      // Track purchase events
      for (const item of items) {
        try {
          await redisService.trackEvent(
            item.productId,
            "purchase",
            userId,
            item.price * item.quantity
          );
        } catch (error) {
          console.error("Error tracking purchase event:", error);
        }
      }

      res.status(201).json({
        success: true,
        message: "Order created successfully",
        order,
      });
    } catch (error) {
      next(error);
    }
  }
}
