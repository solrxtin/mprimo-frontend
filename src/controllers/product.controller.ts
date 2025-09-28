// src/controllers/product.controller.ts
import { Request, Response, NextFunction } from "express";
import { ProductService } from "../services/product.service";
import redisService from "../services/redis.service";
import User from "../models/user.model";
import Vendor from "../models/vendor.model";
import { validateProductData } from "../utils/validate-create-product";
import Product from "../models/product.model";
import Notification from "../models/notification.model";
import { IVendor } from "../types/vendor.type";

import { socketService } from "..";
import AuditLogService from "../services/audit-log.service";

import { PushNotificationService } from "../services/push-notification.service";
import { CurrencyService } from "../services/currency.service";
import Country, { ICountry } from "../models/country.model";
import { CartService } from "../services/cart.service";
import mongoose, { Types } from "mongoose";
import { WishList } from "../models/cart.model";
import Order from "../models/order.model";
import { SubscriptionService } from "../services/subscription.service";

export class ProductController {
  static async createProduct(req: Request, res: Response, next: NextFunction) {
    // I have to add bid increment from country
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

      if (!supposedVendor) {
        res.status(404).json({
          success: false,
          message: "Vendor not found",
        });
        return;
      }

      // Check subscription plan limits
      const currentProductCount = supposedVendor.analytics?.productCount || 0;
      const canAddProduct = await SubscriptionService.checkPlanLimits(
        supposedVendor._id.toString(),
        "add_product",
        currentProductCount
      );

      if (!canAddProduct) {
        res.status(403).json({
          success: false,
          message:
            "Product limit reached for your subscription plan. Upgrade to add more products.",
        });
        return;
      }

      // Check if product is being featured
      if (req.body.featured || req.body.isFeatured) {
        const currentFeaturedCount =
          supposedVendor.analytics?.featuredProducts || 0;
        const canFeatureProduct = await SubscriptionService.checkPlanLimits(
          supposedVendor._id.toString(),
          "feature_product",
          currentFeaturedCount
        );

        if (!canFeatureProduct) {
          res.status(403).json({
            success: false,
            message:
              "Featured product limit reached for your subscription plan. Upgrade to feature more products.",
          });
          return;
        }
      }

      // Ensure variants exist and have default flags
      if (!req.body.variants || req.body.variants.length === 0) {
        return res.status(400).json({
          success: false,
          message: "At least one variant is required for product creation",
        });
      }

      // Ensure at least one variant and option is marked as default
      if (!req.body.variants.some((v: any) => v.isDefault)) {
        req.body.variants[0].isDefault = true;
      }

      req.body.variants.forEach((variant: any) => {
        if (variant.isDefault && variant.options?.length > 0) {
          if (!variant.options.some((o: any) => o.isDefault)) {
            variant.options[0].isDefault = true;
          }
        }
      });

      const productData = {
        ...req.body,
        vendorId: supposedVendor!._id,
      };

      // Create product and fetch populated product details in parallel
      const [savedProduct, _] = await Promise.all([
        Product.create(productData),
        redisService.indexProduct(productData), // Index while creating
      ]);

      // Update vendor analytics - increment product count
      await Vendor.findByIdAndUpdate(supposedVendor._id, {
        $inc: {
          "analytics.productCount": 1,
          ...(req.body.featured || req.body.isFeatured
            ? { "analytics.featuredProducts": 1 }
            : {}),
        },
      });

      // Fetch complete product details in parallel
      const product = await Product.findById(savedProduct._id)
        .populate({
          path: "vendorId",
          select: "accountType businessInfo sellingLimits ratings analytics",
          populate: {
            path: "userId",
            select: "email profile role",
          },
        })
        .populate({ path: "country", select: "name currency" })
        .populate("category.main", "name slug")
        .populate("category.sub", "name slug");

      res.status(201).json({
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
        subCategory1,
        subCategory2,
        subCategory3,
        subCategory4,
        brand,
        status,
        priceRange,
        sort,
      } = req.query;

      // Cast query params to strings
      const categoryStr = category ? String(category) : undefined;
      const subCategory1Str = subCategory1 ? String(subCategory1) : undefined;
      const subCategory2Str = subCategory2 ? String(subCategory2) : undefined;
      const subCategory3Str = subCategory3 ? String(subCategory3) : undefined;
      const subCategory4Str = subCategory4 ? String(subCategory4) : undefined;
      const brandStr = brand ? String(brand) : undefined;
      const statusStr = status ? String(status) : undefined;
      const priceRangeStr = priceRange ? String(priceRange) : undefined;

      // Build category filter
      const categoryFilter: any = {};
      if (categoryStr) categoryFilter["category.main"] = categoryStr;
      if (subCategory1Str)
        categoryFilter["category.sub"] = { $in: [subCategory1Str] };
      if (subCategory2Str)
        categoryFilter["category.sub"] = { $in: [subCategory2Str] };
      if (subCategory3Str)
        categoryFilter["category.sub"] = { $in: [subCategory3Str] };
      if (subCategory4Str)
        categoryFilter["category.sub"] = { $in: [subCategory4Str] };

      const query = {
        ...categoryFilter,
        ...(brandStr && { brand: { $regex: brandStr, $options: "i" } }),
        ...(statusStr && { status: statusStr }),
        ...(priceRangeStr && {
          "variants.options.price": {
            $gte: Number(priceRangeStr.split("-")[0]),
            $lte: Number(priceRangeStr.split("-")[1]),
          },
        }),
      };

      const sortQuery = sort ? JSON.parse(String(sort)) : { createdAt: -1 };

      // Get products and additional data in parallel
      const [result, brands, categoryTree] = await Promise.all([
        ProductService.getProducts(
          query,
          Number(page),
          Number(limit),
          sortQuery
        ),
        ProductService.getBrandsForCategory({
          category: categoryStr,
          subCategory1: subCategory1Str,
          subCategory2: subCategory2Str,
          subCategory3: subCategory3Str,
          subCategory4: subCategory4Str,
        }),
        ProductService.getCategoryTree({
          category: categoryStr,
          subCategory1: subCategory1Str,
          subCategory2: subCategory2Str,
          subCategory3: subCategory3Str,
          subCategory4: subCategory4Str,
        }),
      ]);

      res.json({
        ...result,
        filters: {
          brands,
          categoryTree,
        },
      });
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
        product = await redisService.getProductWithCache({ id: req.params.id });
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

      // Convert prices to user's currency
      const userCurrency = req.preferences?.currency || "USD";
      const productCountry = await Country.findById(product.country);
      const productCurrency = productCountry?.currency || "USD";

      if (product.variants && product.variants.length > 0) {
        for (const variant of product.variants) {
          for (const option of variant.options) {
            if (productCurrency !== userCurrency) {
              const priceConversion =
                await CurrencyService.getProductPriceForUser(
                  option.salePrice ? option.salePrice : option.price,
                  productCurrency,
                  userCurrency
                );
              option.displayPrice = priceConversion.displayPrice;
              option.displayCurrency = priceConversion.displayCurrency;
              option.currencySymbol = priceConversion.currencySymbol;
              option.exchangeRate = priceConversion.exchangeRate;
            } else {
              option.displayPrice = option.salePrice
                ? option.salePrice
                : option.price;
              option.displayCurrency = productCurrency;
              option.currencySymbol =
                productCountry?.currencySymbol || productCurrency;
            }
          }
        }
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
  static async getProductBySlug(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const slug = req.params.slug;
      if (!slug) {
        res
          .status(400)
          .json({ success: false, message: "Product slug is required" });
        return;
      }
      // Use Redis cache for product data if available
      let product;
      try {
        product = await redisService.getProductWithCache({
          slug: req.params.slug,
        });
      } catch (error) {
        // Fallback to database if Redis fails
        product = await ProductService.getProductBySlug(req.params.slug);
      }

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      // Track view asynchronously without waiting for result
      try {
        redisService.trackEvent(product?._id!.toString(), "view", req.userId!);
      } catch (error) {
        console.error("Error tracking view:", error);
      }

      res.json({ product });
    } catch (error) {
      next(error);
    }
  }

  static async getProductPerformance(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { productId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid product ID format",
        });
      }

      const product = await Product.findById(productId)
        .populate("country", "currency")
        .select("analytics variants country");

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      // Get order data for this product
      const orderStats = await Order.aggregate([
        {
          $match: {
            "items.productId": new mongoose.Types.ObjectId(productId),
            "payment.status": "completed",
          },
        },
        {
          $unwind: "$items",
        },
        {
          $match: {
            "items.productId": new mongoose.Types.ObjectId(productId),
          },
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: "$items.quantity" },
            totalRevenue: {
              $sum: { $multiply: ["$items.price", "$items.quantity"] },
            },
            orderCount: { $sum: 1 },
          },
        },
      ]);

      // Get wishlist count
      const wishlistCount = await WishList.countDocuments({
        "items.productId": productId,
      });

      const stats = orderStats[0] || {
        totalSales: 0,
        totalRevenue: 0,
        orderCount: 0,
      };
      const currency = (product.country as ICountry).currency || "USD";

      const performance = {
        views: product.analytics.views,
        favorites: wishlistCount,
        sales: stats.orderCount,
        revenue: stats.totalRevenue,
        totalSales: stats.totalSales,
        currency,
        averageOrderValue:
          stats.orderCount > 0 ? stats.totalRevenue / stats.orderCount : 0,
      };

      res.json(performance);
    } catch (error) {
      next(error);
    }
  }

  static async updateProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const originalProduct = await ProductService.getProductById(
        req.params.id
      );
      const vendor = await Vendor.findOne({ userId: req.userId });
      // Run product update and cache invalidation in parallel
      const [product, _] = await Promise.all([
        ProductService.updateProduct(req.params.id, vendor?._id!, req.body),
        redisService.invalidateProductCache({ id: req.params.id }),
      ]);

      redisService.indexProduct(product);

      const changes: Record<string, any> = {};

      Object.keys(req.body).forEach((key) => {
        const origValue = (originalProduct as Record<string, any>)[key];
        const newValue = req.body[key];

        if (JSON.stringify(origValue) !== JSON.stringify(newValue)) {
          changes[key] = { from: origValue, to: newValue };
        }
      });

      await AuditLogService.log(
        "PRODUCT_UPDATED",
        "product",
        "info",
        {
          productId: req.params.id,
          productName: product.name,
          vendorId: vendor?._id,
          changes,
        },
        req,
        req.params.id
      );

      res.json({ product });
    } catch (error) {
      console.error("Error updating product:", error);
      next(error); // Ensure the error is properly passed to middleware
    }
  }

  static async deleteProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const vendor = await Vendor.findOne({ userId: req.userId });
      if (!vendor) {
        throw new Error("Unauthorized");
      }

      const product = await ProductService.deleteProduct(
        req.params.id,
        vendor._id
      );

      // Update vendor analytics - decrement product count
      await Vendor.findByIdAndUpdate(vendor._id, {
        $inc: {
          "analytics.productCount": -1,
          ...(product.isFeatured ? { "analytics.featuredProducts": -1 } : {}),
        },
      });

      // Invalidate cache after delete
      try {
        await redisService.invalidateProductCache({ id: req.params.id });
      } catch (error) {
        console.error("Error invalidating cache:", error);
      }

      // Get price from first variant option
      let price = 0;
      if (product.variants && product.variants.length > 0) {
        const firstVariant = product.variants[0];
        if (firstVariant.options && firstVariant.options.length > 0) {
          price = firstVariant.options[0].price;
        }
      }

      await AuditLogService.log(
        "PRODUCT_DELETED",
        "product",
        "warning",
        {
          productId: req.params.id,
          productName: product.name,
          vendorId: req.userId,
          price: price,
        },
        req,
        req.params.id
      );

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
    const { quantity, operation, variantId } = req.body;
    const productId = req.params.id;
    const userId = req.userId!;
    const vendor = await Vendor.findOne({ userId });

    if (!variantId) {
      res
        .status(400)
        .json({ success: false, message: "variantId is required" });
      return;
    }

    try {
      const originalProduct = await ProductService.getProductById(productId);

      // Find the specific variant option
      let originalQuantity = 0;
      let newQuantity = 0;

      if (originalProduct?.variants) {
        for (const variant of originalProduct.variants) {
          const option = variant.options.find((opt) => opt.sku === variantId);
          if (option) {
            originalQuantity = option.quantity;
            break;
          }
        }
      }

      const product = await ProductService.updateVariantInventory(
        productId,
        vendor!,
        variantId,
        Number(quantity),
        operation as "add" | "subtract"
      );

      // Get new quantity
      if (product?.variants) {
        for (const variant of product.variants) {
          const option = variant.options.find((opt) => opt.sku === variantId);
          if (option) {
            newQuantity = option.quantity;
            break;
          }
        }
      }

      // Update inventory in Redis
      try {
        const change =
          operation === "add" ? Number(quantity) : -Number(quantity);
        await redisService.updateInventory(productId, change);
        await redisService.invalidateProductCache({ id: productId });
        redisService.indexProduct(product);
      } catch (error) {
        console.error("Error updating Redis inventory:", error);
      }

      await AuditLogService.log(
        "INVENTORY_UPDATED",
        "product",
        "info",
        {
          productId,
          productName: product.name,
          vendorId: userId,
          variantId,
          operation,
          quantity: Number(quantity),
          previousQuantity: originalQuantity,
          newQuantity,
        },
        req,
        productId
      );

      res.json({ product });
    } catch (error) {
      next(error);
    } finally {
      if (vendor)
        await redisService.releaseLock(productId, vendor._id.toString());
    }
  }

  static async addVariant(req: Request, res: Response, next: NextFunction) {
    try {
      const vendor = await Vendor.findOne({ userId: req.userId });
      if (!vendor) {
        throw new Error("Unauthorized");
      }

      // Check if this is a bulk operation (multiple variants)
      if (Array.isArray(req.body) && req.body.length > 1) {
        const { SubscriptionService } = await import(
          "../services/subscription.service"
        );
        const hasBulkUpload = await SubscriptionService.checkPlanLimits(
          vendor._id.toString(),
          "bulk_upload"
        );

        if (!hasBulkUpload) {
          return res.status(403).json({
            success: false,
            message:
              "Bulk variant upload requires Pro or Elite plan. Upgrade to add multiple variants at once.",
          });
        }

        // Track bulk upload usage
        await Vendor.findByIdAndUpdate(vendor._id, {
          $inc: { "analytics.bulkUploadsUsed": 1 },
          $set: { "analytics.lastBulkUpload": new Date() },
        });
      }
      const product = await ProductService.addVariant(
        req.params.id,
        vendor._id,
        req.body
      );

      // Invalidate cache after update
      try {
        await redisService.invalidateProductCache({ id: req.params.id });
      } catch (error) {
        console.error("Error invalidating cache:", error);
      }
      redisService.indexProduct(product);

      await AuditLogService.log(
        "PRODUCT_VARIANT_ADDED",
        "product",
        "info",
        {
          productId: req.params.id,
          vendorId: req.userId,
          variantName: req.body.name,
        },
        req,
        req.params.id
      );

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

      let filters = {
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

      // Run suggestions and search in parallel to optimize response time
      const [suggestions, results] = await Promise.all([
        q && typeof q === "string" && q.length < 10
          ? redisService.getSuggestions(q.toLowerCase())
          : Promise.resolve([]), // If no suggestions needed, return empty array
        ProductService.searchProducts(
          String(q),
          filters,
          Number(page),
          Number(limit)
        ),
      ]);

      console.log("Suggestions: ", suggestions);

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

      let productIds: any;
      // If Redis has data, return it
      if (topProducts && topProducts.length > 0) {
        // Extract product IDs
        productIds = topProducts.filter((_, index) => index % 2 === 0);
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
      const { id } = req.params;
      const { eventType } = req.body;
      const userId = req.userId || null;

      if (
        !["view", "click", "addToCart", "purchase", "wishlist"].includes(
          eventType
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid event type",
        });
      }

      // Track event in Redis
      try {
        await redisService.trackEvent(
          id,
          eventType as "view" | "click" | "addToCart" | "purchase" | "wishlist",
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

  // ===================== Review section ==========================
  static async addReview(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { rating, comment, vendorRating } = req.body;
      const userId = req.userId;

      const reviewData = {
        userId,
        rating,
        comment,
        createdAt: new Date(),
        helpful: [] as unknown as Types.Array<Types.ObjectId>,
      };

      const result = await ProductService.addReview(
        id,
        reviewData,
        userId,
        vendorRating
      );

      // Invalidate product cache after adding review
      try {
        await redisService.invalidateProductCache({ id });
      } catch (error) {
        console.error("Error invalidating cache:", error);
      }
      redisService.indexProduct(result);

      await AuditLogService.log(
        "PRODUCT_REVIEW_ADDED",
        "product",
        "info",
        {
          productId: id,
          reviewerId: userId,
          rating,
          hasComment: !!comment,
        },
        req,
        id
      );

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

  // Draft section
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
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      const result = await ProductService.updateDraft(
        draftId,
        draftData,
        userId
      );

      if (!result) {
        res.status(404).json({
          success: false,
          message: "Draft not found",
        });
        return;
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
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      const result = await ProductService.deleteDraft(draftId, userId);

      if (!result) {
        res.status(404).json({
          success: false,
          message: "Draft not found",
        });
        return;
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

  // Cart section
  static async addToCart(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;
      const { productId, quantity, price, variantId, optionId } = req.body;

      if (!userId || !productId || !quantity || !price || !variantId) {
        res.status(400).json({
          success: false,
          message:
            "Missing cart parameters (productId, quantity, price, variantId required)",
        });
        return;
      }

      if (variantId && !optionId) {
        res.status(400).json({
          success: false,
          message: "optionId is required when variantId is provided",
        });
        return;
      }

      const product = await ProductService.getProductById(productId);
      if (!product) {
        res.status(404).json({ success: false, message: "Product not found" });
        return;
      }

      if (product.inventory.listing.type === "instant") {
        const variant = product.variants.find(
          (v: any) => v._id.toString() === variantId
        );
        if (!variant) {
          res
            .status(404)
            .json({ success: false, message: "Variant not found" });
          return;
        }

        const option = variant.options.find(
          (o: any) => o._id.toString() === optionId
        );

        if (!option) {
          res
            .status(404)
            .json({ success: false, message: "Variant option not found" });
          return;
        }

        if (option.quantity < quantity) {
          res.status(400).json({
            success: false,
            message: `Only ${option.quantity} items in stock`,
          });
          return;
        }

        if (option.salePrice !== price) {
          res.status(400).json({
            success: false,
            message: `Price mismatch. Current price is ${option.salePrice}`,
          });
          return;
        }
      }

      const cart = await CartService.addToCart(userId.toString(), {
        productId,
        variantId,
        name: product.name,
        images: product.images,
        quantity,
        price,
        optionId,
      });

      if (cart) {
        await redisService.trackEvent(productId, "addToCart", userId);
        res
          .status(200)
          .json({ success: true, message: "Product added to cart", cart });
      } else {
        res
          .status(500)
          .json({ success: false, message: "Failed to add to cart" });
      }
    } catch (error) {
      next(error);
    }
  }

  static async mergeCart(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;
      const { cart } = req.body;

      if (!userId || !cart) {
        res
          .status(400)
          .json({ success: false, message: "Missing user or cart" });
        return;
      }

      if (!Array.isArray(cart)) {
        res
          .status(400)
          .json({ success: false, message: "Invalid cart format" });
        return;
      }

      // Add each cart item using CartService
      let successCount = 0;
      for (const item of cart) {
        if (item.productId && item.variantId && item.quantity && item.price) {
          const success = await CartService.addToCart(userId.toString(), {
            productId: item.productId,
            variantId: item.variantId,
            optionId: item.optionId,
            name: item.name,
            images: item.images,
            quantity: item.quantity,
            price: item.price,
          });
          if (success) successCount++;
        }
      }

      res.status(200).json({
        success: true,
        message: `Cart merged: ${successCount}/${cart.length} items added`,
      });
    } catch (error) {
      next(error);
    }
  }

  static async removeProductFromCart(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.userId;
      const { productId } = req.params;
      const { variantId } = req.body;

      if (!userId || !productId) {
        res
          .status(400)
          .json({ success: false, message: "Missing user or productId" });
        return;
      }

      const success = await CartService.removeFromCart(
        userId.toString(),
        productId,
        variantId
      );

      if (success) {
        res
          .status(200)
          .json({ success: true, message: "Product removed from cart" });
      } else {
        res
          .status(500)
          .json({ success: false, message: "Failed to remove from cart" });
      }
    } catch (error) {
      next(error);
    }
  }

  static async getCart(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;

      if (!userId) {
        res.status(400).json({ success: false, message: "Missing user ID" });
        return;
      }

      const cart = await CartService.getCart(userId.toString());
      res.status(200).json({ success: true, cart });
    } catch (error) {
      console.error("Error getting cart:", error);
      next(error);
    }
  }

  static async clearCart(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;

      if (!userId) {
        res.status(400).json({ success: false, message: "Missing user ID" });
        return;
      }

      const success = await CartService.clearCart(userId.toString());

      if (success) {
        res.status(200).json({ success: true, message: "Cart cleared" });
      } else {
        res
          .status(500)
          .json({ success: false, message: "Failed to clear cart" });
      }
    } catch (error) {
      next(error);
    }
  }

  // Wishlist section
  static async addToWishlist(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;
      const { productId } = req.params;
      const { price } = req.body;

      if (!productId || !userId || !price) {
        res.status(400).json({
          success: false,
          message: "Missing required fields (productId, price)",
        });
        return;
      }

      const success = await CartService.addToWishlist(userId.toString(), {
        productId,
        priceWhenAdded: price,
      });

      if (success) {
        await redisService.trackEvent(productId, "wishlist", userId);
        res.status(200).json({ success: true, message: "Added to wishlist" });
      } else {
        res
          .status(500)
          .json({ success: false, message: "Failed to add to wishlist" });
      }
    } catch (error) {
      next(error);
    }
  }

  static async removeFromWishlist(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.userId;
      const { productId } = req.params;

      if (!productId || !userId) {
        res.status(400).json({ success: false, message: "Invalid input" });
        return;
      }

      const success = await CartService.removeFromWishlist(
        userId.toString(),
        productId
      );

      if (success) {
        res
          .status(200)
          .json({ success: true, message: "Removed from wishlist" });
      } else {
        res
          .status(500)
          .json({ success: false, message: "Failed to remove from wishlist" });
      }
    } catch (error) {
      next(error);
    }
  }

  static async getWishlist(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const wishlist = await CartService.getWishlist(userId.toString());
      res.status(200).json({ success: true, data: wishlist });
    } catch (error) {
      next(error);
    }
  }

  static async clearWishlist(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const success = await CartService.clearWishlist(userId.toString());

      if (success) {
        res.status(200).json({ success: true, message: "Wishlist cleared" });
      } else {
        res
          .status(500)
          .json({ success: false, message: "Failed to clear wishlist" });
      }
    } catch (error) {
      next(error);
    }
  }

  // ============= Offer Section =================
  static async makeOffer(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;
      const { productId } = req.params;
      const { price, variantId, optionId } = req.body;

      if (!userId || !productId || !price || !variantId || !optionId) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: price, variantId, optionId",
        });
      }

      const product = await Product.findById(productId).populate<{
        vendorId: IVendor;
      }>("vendorId");
      if (!product) {
        return res
          .status(404)
          .json({ success: false, message: "Product not found" });
      }

      if (product.inventory.listing.type !== "instant") {
        return res.status(400).json({
          success: false,
          message: "No offers can be made on this product",
        });
      }

      if (!product.inventory.listing?.instant?.acceptOffer) {
        return res.status(400).json({
          success: false,
          message: "Offers are not accepted for this product",
        });
      }

      // Find existing offer block for this user
      const existingOffer = product.offers.find(
        (offer) => offer.userId.toString() === userId.toString()
      );

      // Check if user has already made 3 offers for this variant+option
      const variantOffers =
        existingOffer?.userOffers.filter(
          (o) =>
            o.variantId.toString() === variantId &&
            o.optionId.toString() === optionId
        ) || [];

      if (variantOffers.length === 3) {
        return res.status(400).json({
          success: false,
          message:
            "Maximum number of offers reached for this variant and option",
        });
      }

      const lastOffer = variantOffers[variantOffers.length - 1];

      if (lastOffer && !lastOffer.rejected) {
        return res.status(400).json({
          success: false,
          message: "Last offer must be rejected before making a new one",
        });
      }

      if (lastOffer && lastOffer.accepted) {
        return res.status(400).json({
          success: false,
          message:
            "Your last offer was accepted, no further offers can be made",
        });
      }

      if (lastOffer && lastOffer.amount >= price) {
        return res.status(400).json({
          success: false,
          message: "New offer must be higher than your last offer",
        });
      }

      const newOffer = {
        amount: price,
        variantId,
        optionId,
        accepted: false,
        rejected: false,
        createdAt: new Date(),
      };

      if (existingOffer) {
        existingOffer.userOffers.push(newOffer);
      } else {
        product.offers.push({
          userId,
          userOffers: [newOffer],
          counterOffers: [],
        });
      }

      const notification = Notification.create({
        userId: product.vendorId.userId,
        case: "new-offer",
        type: "offer",
        title: `New offer made for ${product.name}`,
        message: `Offer of ${price} made for ${product.name} (variant: ${variantId}, option: ${optionId})`,
        data: {
          redirectUrl: "/",
          entityId: product._id,
          entityType: "product",
        },
        isRead: false,
      });

      const saveProduct = product.save();

      const [savedNotification] = await Promise.all([
        notification,
        saveProduct,
      ]);

      await PushNotificationService.notifyVendor(
        product.vendorId.userId.toString(),
        product.vendorId._id!,
        "offer",
        savedNotification
      );

      return res
        .status(201)
        .json({ success: true, message: "Offer successfully made" });
    } catch (error) {
      next(error);
    }
  }
}

export const makeCounterOffer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, price, variantId, optionId } = req.body;
    const { productId } = req.params;

    if (!userId || !productId || !price || !variantId || !optionId) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: userId, productId, price, variantId, optionId",
      });
    }

    const vendor = await Vendor.findOne({ userId: req.userId });
    if (!vendor) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const product = await Product.findOne({
      _id: productId,
      offers: { $elemMatch: { userId } },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or no offer from this user",
      });
    }

    const existingOffer = product.offers.find(
      (offer) => offer.userId.toString() === userId.toString()
    );

    if (!existingOffer) {
      return res.status(400).json({
        success: false,
        message: "No existing offer found from this user",
      });
    }

    // Find the last user offer for this variant+option
    const variantOffers = existingOffer.userOffers.filter(
      (o) =>
        o.variantId.toString() === variantId &&
        o.optionId.toString() === optionId
    );

    if (variantOffers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No offer found for this variant and option",
      });
    }

    const lastUserOffer = variantOffers[variantOffers.length - 1];

    if (price <= lastUserOffer.amount) {
      return res.status(400).json({
        success: false,
        message: "Counter offer must be greater than the user's last offer",
      });
    }

    const counterOffer = {
      amount: price,
      variantId,
      optionId,
      accepted: false,
      rejected: false,
      createdAt: new Date(),
    };

    existingOffer.counterOffers.push(counterOffer);

    const notificationData = {
      userId,
      type: "offer",
      case: "new-counter-offer",
      title: `Vendor countered your offer for ${product.name}`,
      message: `A counter offer of ${price} was made for ${product.name} (variant: ${variantId}, option: ${optionId})`,
      data: {
        redirectUrl: "/",
        entityId: product._id,
        entityType: "product",
      },
      isRead: false,
    };

    const [notification] = await Promise.all([
      Notification.create(notificationData),
      product.save(),
    ]);

    await PushNotificationService.notifyUser(
      userId,
      "counter-offer",
      notification
    );

    return res.status(201).json({
      success: true,
      message: "Counter offer successfully made",
    });
  } catch (error) {
    console.error("Counter Offer Error:", error);
    next(error);
  }
};

export const acceptOffer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId, userId, variantId, optionId } = req.body;
    const { vendorId } = req.params;

    if (!productId || !userId || !variantId || !optionId) {
      return res.status(400).json({ success: false, message: "Missing input" });
    }

    const product = await Product.findOne({
      _id: productId,
      vendorId,
      offers: { $elemMatch: { userId } },
    });

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    const existingOffer = product.offers.find(
      (o) => o.userId.toString() === userId.toString()
    );

    if (!existingOffer) {
      return res
        .status(404)
        .json({ success: false, message: "Offer not found" });
    }

    // Find the last user offer for this variant+option
    const variantOffers = existingOffer.userOffers.filter(
      (o) =>
        o.variantId.toString() === variantId &&
        o.optionId.toString() === optionId
    );

    if (variantOffers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No offer found for this variant and option",
      });
    }

    const latestUserOffer = variantOffers[variantOffers.length - 1];

    if (latestUserOffer) latestUserOffer.accepted = true;

    // Prepare both async tasks
    const savePromise = product.save();
    const createNotificationPromise = Notification.create({
      userId,
      case: "offer-accepted",
      type: "offer",
      title: `Offer accepted for ${product.name}`,
      message: `Offer for your ${product.name} was accepted`,
      data: {
        redirectUrl: "/",
        entityId: product._id,
        entityType: "product",
      },
      isRead: false,
    });

    // Await them together
    const [_, notification] = await Promise.all([
      savePromise,
      createNotificationPromise,
    ]);

    await PushNotificationService.notifyUser(
      userId,
      "offer-accepted",
      notification
    );

    return res.status(200).json({ success: true, message: "Offer accepted" });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const acceptCounterOffer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    const { productId, variantId, optionId } = req.body;

    if (!productId || !variantId || !optionId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: productId, variantId, optionId",
      });
    }

    const product = await Product.findOne({
      _id: productId,
      offers: { $elemMatch: { userId } },
    }).populate<{ vendorId: IVendor }>("vendorId");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or no offer from this user",
      });
    }

    const offerBlock = product.offers.find(
      (o) => o.userId.toString() === userId.toString()
    );

    if (!offerBlock) {
      return res.status(404).json({
        success: false,
        message: "Offer block not found for this user",
      });
    }

    const matchingCounterOffers = offerBlock.counterOffers.filter(
      (co) =>
        co.variantId?.toString() === variantId &&
        co.optionId?.toString() === optionId
    );

    if (matchingCounterOffers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No counter offer found for this variant and option",
      });
    }

    const latestCounterOffer =
      matchingCounterOffers[matchingCounterOffers.length - 1];

    if (latestCounterOffer.accepted) {
      return res.status(400).json({
        success: false,
        message: "Counter offer has already been accepted",
      });
    }

    latestCounterOffer.accepted = true;

    const saveProduct = product.save();
    const createNotification = Notification.create({
      userId: product.vendorId.userId,
      case: "counter-offer-accepted",
      type: "offer",
      title: `Counter offer accepted for ${product.name}`,
      message: `Your counter offer for ${product.name} (variant: ${variantId}, option: ${optionId}) was accepted`,
      data: {
        redirectUrl: "/",
        entityId: product._id,
        entityType: "product",
      },
      isRead: false,
    });

    const [_, notification] = await Promise.all([
      saveProduct,
      createNotification,
    ]);

    await PushNotificationService.notifyVendor(
      product.vendorId.userId.toString(),
      product.vendorId._id!,
      "counter-offer-accepted",
      notification
    );

    return res.status(200).json({
      success: true,
      message: "Counter offer accepted successfully",
    });
  } catch (error) {
    console.error("Accept Counter Offer Error:", error);
    next(error);
  }
};

export const rejectOffer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId, userId, variantId, optionId } = req.body;
    const { vendorId } = req.params;

    if (!productId || !userId || !variantId || !optionId) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: productId, userId, variantId, optionId",
      });
    }

    const product = await Product.findOne({
      _id: productId,
      vendorId,
      offers: { $elemMatch: { userId } },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or no offer from this user",
      });
    }

    const offerBlock = product.offers.find(
      (o) => o.userId.toString() === userId.toString()
    );

    if (!offerBlock) {
      return res.status(404).json({
        success: false,
        message: "Offer block not found for this user",
      });
    }

    const variantOffers = offerBlock.userOffers.filter(
      (o) =>
        o.variantId?.toString() === variantId &&
        o.optionId?.toString() === optionId
    );

    if (variantOffers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No offer found for this variant and option",
      });
    }

    const latestUserOffer = variantOffers[variantOffers.length - 1];

    if (latestUserOffer.rejected) {
      return res.status(400).json({
        success: false,
        message: "Offer has already been rejected",
      });
    }

    latestUserOffer.rejected = true;

    const saveProduct = product.save();

    const notification = Notification.create({
      userId,
      case: "offer-rejected",
      type: "offer",
      title: `Offer rejected for ${product.name}`,
      message: `Your offer for ${
        product.name
      } (variant: ${variantId}, option: ${optionId}) was rejected. You have ${
        3 - variantOffers.length
      } offer(s) left for this configuration.`,
      data: {
        redirectUrl: "/",
        entityId: product._id,
        entityType: "product",
      },
      isRead: false,
    });

    const [_, createdNotification] = await Promise.all([
      saveProduct,
      notification,
    ]);

    await PushNotificationService.notifyUser(
      userId,
      "offer-rejected",
      createdNotification
    );

    return res.status(200).json({
      success: true,
      message: "Offer rejected successfully",
    });
  } catch (error) {
    console.error("Reject Offer Error:", error);
    next(error);
  }
};

export const rejectCounterOffer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    const { productId, variantId, optionId } = req.body;

    if (!productId || !userId || !variantId || !optionId) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: productId, userId, variantId, optionId",
      });
    }

    const product = await Product.findOne({
      _id: productId,
      offers: { $elemMatch: { userId } },
    }).populate<{ vendorId: IVendor }>("vendorId");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or no offer from this user",
      });
    }

    const offerBlock = product.offers.find(
      (o) => o.userId.toString() === userId.toString()
    );

    if (!offerBlock) {
      return res.status(404).json({
        success: false,
        message: "Offer block not found for this user",
      });
    }

    const matchingCounterOffers = offerBlock.counterOffers.filter(
      (co) =>
        co.variantId?.toString() === variantId &&
        co.optionId?.toString() === optionId
    );

    if (matchingCounterOffers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No counter offer found for this variant and option",
      });
    }

    const latestCounterOffer =
      matchingCounterOffers[matchingCounterOffers.length - 1];

    if (latestCounterOffer.rejected) {
      return res.status(400).json({
        success: false,
        message: "Counter offer has already been rejected",
      });
    }

    latestCounterOffer.rejected = true;

    const saveProduct = product.save();

    const createNotification = Notification.create({
      userId,
      case: "counter-offer-rejected",
      type: "offer",
      title: `Counter offer rejected for ${product.name}`,
      message: `Your counter offer for ${product.name} (variant: ${variantId}, option: ${optionId}) was rejected`,
      data: {
        redirectUrl: "/",
        entityId: product._id,
        entityType: "product",
      },
      isRead: false,
    });

    const [_, notification] = await Promise.all([
      saveProduct,
      createNotification,
    ]);

    await PushNotificationService.notifyVendor(
      product.vendorId.userId.toString(),
      product.vendorId._id!,
      "counter-offer-rejected",
      notification
    );

    return res.status(200).json({
      success: true,
      message: "Counter offer rejected successfully",
    });
  } catch (error) {
    console.error("Reject Counter Offer Error:", error);
    next(error);
  }
};

// ======================= Bidding Section ========================
export const placeProxyBid = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId } = req.params;
    const { userId, maxBid } = req.body;

    if (!productId || !userId || typeof maxBid !== "number" || maxBid <= 0.01) {
      return res.status(400).json({ success: false, message: "Invalid input" });
    }

    const product = await Product.findById(productId).populate("bids.userId");
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    if (product.inventory?.listing?.type !== "auction") {
      return res
        .status(400)
        .json({ success: false, message: "Not an auction listing" });
    }

    const auction = product.inventory.listing.auction;
    if (!auction?.isStarted) {
      return res
        .status(400)
        .json({ success: false, message: "Auction not started" });
    }

    if (auction?.isExpired) {
      return res
        .status(400)
        .json({ success: false, message: "Auction has ended" });
    }

    const startBid = auction.startBidPrice ?? 0;
    const minIncrement = auction.bidIncrement ?? 1;
    const now = new Date();

    let currentBids = product.bids || [];
    let existingBid = currentBids.find(
      (b) => b.userId.toString() === userId.toString()
    );

    if (existingBid) {
      existingBid.maxAmount = maxBid;
    } else {
      currentBids.push({
        userId,
        maxAmount: maxBid,
        currentAmount: 0,
        createdAt: now,
      });
    }

    // Sort bidders by maxAmount descending
    currentBids.sort((a, b) => b.maxAmount - a.maxAmount);

    // Run bid simulation
    let currentAmount = startBid;
    let notifications: any[] = [];

    for (let i = currentBids.length - 1; i > 0; i--) {
      const lower = currentBids[i];
      const higher = currentBids[i - 1];

      if (higher.maxAmount > currentAmount) {
        const proposed = Math.min(
          higher.maxAmount,
          lower.maxAmount + minIncrement
        );
        if (proposed > currentAmount) {
          currentAmount = proposed;
          higher.currentAmount = proposed;

          // Notify the lower bidder that they've been outbid
          notifications.push({
            userId: lower.userId,
            type: "bid",
            case: "",
            title: `Outbid on ${product.name}`,
            message: `You've been outbid on ${product.name}.`,
            data: {
              redirectUrl: `/product/${productId}`,
              entityId: product._id,
              entityType: "product",
            },
            isRead: false,
          });

          // Emit to room
          socketService.emitToRoom(productId, "bid-placed", {
            amount: proposed,
            user: higher.userId,
            date: now,
          });
        }
      }
    }

    // Set all bids to not winning by default
    currentBids.forEach((b) => (b.isWinning = false));

    // Set top bid as winner
    const topBid = currentBids[0];
    topBid.currentAmount = currentAmount;
    topBid.isWinning = true;

    // Save and notify
    product.bids = currentBids;
    await product.save();

    // Emit final winning bid
    socketService.emitToRoom(productId, "bid:final", {
      productId,
      currentBid: topBid.currentAmount,
      highestBidder: topBid.userId,
      bidHistory: currentBids.map((b) => ({
        user: b.userId,
        maxAmount: b.maxAmount,
        currentAmount: b.currentAmount,
        isWinning: b.isWinning,
      })),
    });

    // Notify outbid users
    const notificationDocs = notifications.map(
      (note) => new Notification(note)
    );

    const createdNotifications = await Notification.insertMany(
      notificationDocs
    );

    await Promise.all(
      createdNotifications.map((note) =>
        PushNotificationService.notifyUser(
          note.userId.toString(),
          note.type,
          note
        )
      )
    );

    return res.status(201).json({
      success: true,
      message: "Proxy bid placed",
      currentAmount: topBid.currentAmount,
    });
  } catch (error) {
    console.error("Bid error:", error);
    next(error);
  }
};

export const relistItemForAuction = async (req: Request, res: Response) => {
  const { productId } = req.params;
  const { startBidPrice, reservePrice, startTime, endTime, buyNowPrice } =
    req.body;

  try {
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (!startBidPrice || !reservePrice || !startTime || !endTime) {
      return res.status(404).json({
        message:
          "Auction listing requires startBidPrice, reservePrice,  startTime, endTime",
        success: false,
      });
    }

    if (product.inventory.listing.type !== "auction") {
      return res.status(404).json({
        message: "Chosen product can't be relisted",
        success: false,
      });
    }

    // Validate auction dates
    const now = new Date();
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    if (startDate <= now) {
      throw new Error("Auction start time must be in the future");
    }

    if (endDate <= startDate) {
      throw new Error("Auction end time must be after start time");
    }

    const minDurationMs = 24 * 60 * 60 * 1000; // 24 hours
    if (endDate.getTime() - startDate.getTime() < minDurationMs) {
      throw new Error("Auction duration must be at least 24 hours");
    }

    if (product.inventory.listing.auction) {
      product.inventory.listing.auction.startBidPrice = startBidPrice;
      product.inventory.listing.auction.reservePrice = reservePrice;
      if (buyNowPrice) {
        product.inventory.listing.auction.buyNowPrice = buyNowPrice;
      }
      product.inventory.listing.auction.startTime = startTime;
      product.inventory.listing.auction.endTime = endTime;
      product.inventory.listing.auction.isStarted = false;
      product.inventory.listing.auction.isExpired = false;
      product.inventory.listing.auction.priorityScore =
        100 / (product.inventory.listing.auction.relistCount + 1);
      product.inventory.listing.auction.relistCount += 1;
    }
  } catch (error: any) {
    console.error(error);
    // add logger
    res.status(500).json({
      message: error.message,
    });
  }
};

export const getAuctionProducts = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, categoryId, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter: any = {
      "inventory.listing.type": "auction",
    };

    if (categoryId) {
      const catId = new Types.ObjectId(categoryId as string);
      filter.$or = [{ "category.main": catId }, { "category.sub": catId }];
    }

    if (status && !["live", "upcoming", "ended"].includes(status as string)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status filter. Use 'live', 'upcoming', or 'ended'.",
      });
    }

    // Auction status logic
    if (status === "live") {
      filter["inventory.listing.auction.isStarted"] = true;
      filter["inventory.listing.auction.isExpired"] = false;
    } else if (status === "upcoming") {
      filter["inventory.listing.auction.isStarted"] = false;
      filter["inventory.listing.auction.isExpired"] = false;
    } else if (status === "ended") {
      filter["inventory.listing.auction.isExpired"] = true;
    }

    const products = await Product.find(filter)
      .skip(skip)
      .limit(Number(limit))
      .sort({
        "inventory.listing.auction.priorityScore": -1,
        "inventory.listing.auction.startTime": -1,
      });

    const totalProducts = await Product.countDocuments(filter);

    res.status(200).json({
      success: true,
      message: "Auction products fetched successfully",
      pagination: {
        total: totalProducts,
        page,
        limit,
        totalPages: Math.ceil(totalProducts / Number(limit)),
      },
      products,
    });
  } catch (error) {
    console.error("Get Auction Products Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching auction products",
    });
  }
};


export const getFeaturedProducts = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const filter = {
      isFeatured: true,
      status: "active"
    };

    const products = await Product.find(filter)
      .skip(skip)
      .limit(Number(limit))
      .sort({ featuredExpiry: -1, createdAt: -1 }); // prioritize soon-to-expire and newest

    const totalFeatured = await Product.countDocuments(filter);

    res.status(200).json({
      success: true,
      message: "Featured products fetched successfully",
      pagination: {
        total: totalFeatured,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(totalFeatured / Number(limit))
      },
      products
    });
  } catch (error) {
    console.error("Get Featured Products Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching featured products"
    });
  }
};


