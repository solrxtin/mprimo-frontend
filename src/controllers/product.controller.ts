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
import { PushNotificationService } from "../services/push-notification.service";
import { socketService } from "..";

const pushNotificationService = new PushNotificationService();

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

      const hasVariants =
        Array.isArray(req.body.variants) && req.body.variants.length > 0;

      if (hasVariants) {
        const totalVariantQuantity = req.body.variants
          .flatMap((variant: any) => variant.options)
          .reduce(
            (acc: number, option: any) => acc + (option.inventory || 0),
            0
          );

        req.body.inventory.listing.instant.quantity = totalVariantQuantity;
      }

      const productData = {
        ...req.body,
        vendorId: supposedVendor!._id,
      };

      // Create product and fetch populated product details in parallel
      const [savedProduct, indexedProduct] = await Promise.all([
        Product.create(productData),
        redisService.indexProduct(productData), // Index while creating
      ]);

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

  static async updateProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const vendor = await Vendor.findOne({ userId: req.userId });
      // Run product update and cache invalidation in parallel
      const [product] = await Promise.all([
        ProductService.updateProduct(req.params.id, vendor?._id!, req.body),
        redisService.invalidateProductCache({ id: req.params.id }),
      ]);

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

      await ProductService.deleteProduct(req.params.id, vendor._id);

      // Invalidate cache after delete
      try {
        await redisService.invalidateProductCache({ id: req.params.id });
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
    const { quantity, operation } = req.body;
    const productId = req.params.id;
    const userId = req.userId!;
    const vendor = await Vendor.findOne({ userId });
    try {
      const product = await ProductService.updateInventory(
        productId,
        vendor!,
        Number(quantity),
        operation as "add" | "subtract"
      );

      // Update inventory in Redis
      try {
        const change =
          operation === "add" ? Number(quantity) : -Number(quantity);
        await redisService.updateInventory(productId, change);

        // Invalidate product cache
        await redisService.invalidateProductCache({ id: productId });
      } catch (error) {
        console.error("Error updating Redis inventory:", error);
      }

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

      console.log("Suggestions: ", suggestions)

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
        await redisService.invalidateProductCache({ id });
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
      console.log(topProducts)

      let productIds: any;
      // If Redis has data, return it
      if (topProducts && topProducts.length > 0) {
        // Extract product IDs
        productIds = topProducts.filter((_, index) => index % 2 === 0);
        console.log(productIds)
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
      const { eventType } = req.body
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

  static async addToCart(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;
      const { productId, quantity, price, selectedVariant } = req.body;

      if (!userId || !productId || !quantity || !price) {
        res
          .status(400)
          .json({ success: false, message: "Missing cart parameters" });
        return;
      }

      try {
        await redisService.addToCart(
          userId.toString(),
          productId,
          quantity,
          price,
          selectedVariant
        );
        await redisService.trackEvent(productId, "addToCart", userId);
      } catch (err) {
        console.error("Redis tracking error:", err);
        // Fallback to DB update
        await ProductService.updateAnalytics(productId, "addToCart");
      }

      return res
        .status(200)
        .json({ success: true, message: "Product added to cart" });
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

      const user = await User.findById(userId);

      if (user) {
        user.cart = [...(user.cart || []), ...cart];
        await user.save();
      }

      return res.status(200).json({ success: true, message: "Cart merged" });
    } catch (error) {
      next(error);
    }
  }

  static async removeFromCart(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;
      const { productId } = req.params;

      if (!userId || !productId) {
        return res
          .status(400)
          .json({ success: false, message: "Missing user or productId" });
      }

      await redisService.removeFromCart(userId.toString(), productId);

      return res
        .status(200)
        .json({ success: true, message: "Product removed from cart" });
    } catch (error) {
      next(error);
    }
  }

  static async getCart(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;

      if (!userId) {
        return res
          .status(400)
          .json({ success: false, message: "Missing user ID" });
      }

      const cart = await redisService.getCart(userId.toString());

      // Optionally sort by addedAt
      const sorted = cart.sort(
        (a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
      );

      return res.status(200).json({ success: true, cart: sorted });
    } catch (error) {
      next(error);
    }
  }

  static async clearCart(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;

      if (!userId) {
        return res
          .status(400)
          .json({ success: false, message: "Missing user ID" });
      }

      await redisService.clearCart(userId.toString());

      return res.status(200).json({ success: true, message: "Cart cleared" });
    } catch (error) {
      next(error);
    }
  }

  static async addToWishlist(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;
      const { productId } = req.params;

      if (!productId || !userId) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid input" });
      }

      await redisService.addToWishlist(userId.toString(), productId);

      // Track wishlist event
      try {
        await redisService.trackEvent(productId, "wishlist", userId);
      } catch (error) {
        console.error("Redis tracking failed:", error);
        await ProductService.updateAnalytics(productId, "wishlist");
      }

      return res
        .status(200)
        .json({ success: true, message: "Added to wishlist" });
    } catch (error) {
      next(error);
    }
  }

  // Remove from wishlist
  static async removeFromWishlist(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.userId;
      const { productId } = req.params;

      if (!productId || !userId) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid input" });
      }

      await redisService.removeFromWishlist(userId.toString(), productId);

      return res
        .status(200)
        .json({ success: true, message: "Removed from wishlist" });
    } catch (error) {
      next(error);
    }
  }

  // Get user's wishlist
  static async getWishlist(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;
      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      const wishlist = await redisService.getWishlist(userId.toString());
      return res.status(200).json({ success: true, data: wishlist });
    } catch (error) {
      next(error);
    }
  }

  // Clear entire wishlist
  static async clearWishlist(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;
      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      await redisService.clearWishlist(userId.toString());

      return res
        .status(200)
        .json({ success: true, message: "Wishlist cleared" });
    } catch (error) {
      next(error);
    }
  }

  static async makeOffer(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;
      const { productId } = req.params;
      const { price } = req.body;

      if (!userId || !productId || !price) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid input" });
      }

      const product = await Product.findById(productId).populate<{
        vendorId: IVendor;
      }>("vendorId");
      if (!product) {
        return res
          .status(404)
          .json({ success: false, message: "Product not found" });
      }

      const existingOffer = product.offers.find(
        (offer) => offer.userId.toString() === userId.toString()
      );

      if (existingOffer && existingOffer.userOffers.length === 3) {
        return res.status(400).json({
          success: false,
          message: "Maximum number of offers reached",
        });
      }

      if (existingOffer) {
        existingOffer.userOffers.push({
          amount: price,
          accepted: false,
          createdAt: new Date(),
        });
      } else {
        product.offers.push({
          userId,
          userOffers: [
            { amount: price, accepted: false, createdAt: new Date() },
          ],
          counterOffers: [],
        });
      }

      const notification = Notification.create({
        userId: product.vendorId.userId,
        case: "new-offer",
        type: "offer",
        title: `New offer made for ${product.name}`,
        message: `Offer in the amount ${price} was made for your ${product.name}`,
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
    const { userId, productId, price } = req.body;
    const { vendorId } = req.params;

    if (!userId || !productId || !price) {
      return res.status(400).json({ success: false, message: "Invalid input" });
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
      (offer) => offer.userId.toString() === userId.toString()
    );

    if (!existingOffer) {
      return res.status(400).json({
        success: false,
        message: "Counter offer can't be made when no offer has been made.",
      });
    }

    if (existingOffer.userOffers.length <= existingOffer.counterOffers.length) {
      return res.status(400).json({
        success: false,
        message: "You can't make a counter offer at this time",
      });
    }

    const counter = {
      amount: price,
      accepted: false,
      createdAt: new Date(),
    };

    existingOffer.counterOffers.push(counter);

    const notificationData = {
      userId,
      type: "offer",
      case: "new-counter-offer",
      title: `Counter offer made for ${product.name}`,
      message: `Counter offer in the amount ${price} was made for your ${product.name}`,
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
    console.error(error);
    next(error);
  }
};

// ============= Offer Section =================
export const acceptOffer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId, userId } = req.body;
    const { vendorId } = req.params;

    if (!productId || !userId) {
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

    const offer = product.offers.find(
      (o) => o.userId.toString() === userId.toString()
    );

    if (!offer) {
      return res
        .status(404)
        .json({ success: false, message: "Offer not found" });
    }

    const latestUserOffer = offer.userOffers?.[offer.userOffers.length - 1];
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
    const { productId, userId } = req.body;
    const { vendorId } = req.params;

    if (!productId || !userId) {
      res.status(400).json({ success: false, message: "Missing input" });
      return;
    }

    const product = await Product.findOne({
      _id: productId,
      vendorId: vendorId,
      offers: { $elemMatch: { userId: userId } },
    }).populate<{ vendorId: IVendor }>("vendorId");

    if (!product) {
      res.status(404).json({ success: false, message: "Product not found" });
      return;
    }

    const offer = product.offers.find(
      (o) => o.userId.toString() === userId.toString()
    );

    if (!offer) {
      res.status(404).json({ success: false, message: "Offer not found" });
      return;
    }

    // Accept the latest counter offer
    const latestCounterOffer =
      offer.counterOffers?.[offer.counterOffers.length - 1];
    if (latestCounterOffer.accepted) {
      res
        .status(400)
        .json({ success: false, message: "Offer already accepted" });
      return;
    }

    if (latestCounterOffer) latestCounterOffer.accepted = true;
    const productPromise = product.save();

    const notificationPromise = Notification.create({
      userId: product.vendorId.userId,
      case: "counter-offer-accepted",
      type: "offer",
      title: `Counter offer accepted for ${product.name}`,
      message: `Counter offer for your ${product.name} was accepted`,
      data: {
        redirectUrl: "/",
        entityId: product._id,
        entityType: "product",
      },
      isRead: false,
    });

    const [_, notification] = await Promise.all([
      productPromise,
      notificationPromise,
    ]);

    await PushNotificationService.notifyVendor(
      product.vendorId.userId.toString(),
      product.vendorId._id!,
      "counter-offer-accepted",
      notification
    );
    return res.status(200).json({ success: true, message: "Offer accepted" });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const rejectOffer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId, userId } = req.body;
    const { vendorId } = req.params;

    if (!productId || !userId) {
      res.status(400).json({ success: false, message: "Missing input" });
      return;
    }

    const product = await Product.findOne({
      _id: productId,
      vendorId: vendorId,
      offers: { $elemMatch: { userId: userId } },
    });

    if (!product) {
      res.status(404).json({ success: false, message: "Product not found" });
      return;
    }

    const offer = product.offers.find(
      (o) => o.userId.toString() === userId.toString()
    );

    if (!offer) {
      res.status(404).json({ success: false, message: "Offer not found" });
      return;
    }

    // Reject the latest user offer
    const latestUserOffer = offer.userOffers?.[offer.userOffers.length - 1];

    if (latestUserOffer) latestUserOffer.rejected = true;

    const productPromise = product.save();

    const notificationPromise = Notification.create({
      userId: userId,
      case: "offer-rejected",
      type: "offer",
      title: `Offer rejected for ${product.name}`,
      message: `Offer for the ${product.name} was rejected. You have ${
        3 - offer.userOffers.length
      } offer(s) left.`,
      data: {
        redirectUrl: "/",
        entityId: product._id,
        entityType: "product",
      },
      isRead: false,
    });

    const [_, notification] = await Promise.all([
      productPromise,
      notificationPromise,
    ]);

    await PushNotificationService.notifyUser(
      userId,
      "offer-rejected",
      notification
    );

    return res.status(200).json({ success: true, message: "Offer rejected" });
  } catch (error) {
    console.error(error);
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
    const { productId } = req.params;

    if (!productId || !userId) {
      res.status(400).json({ success: false, message: "Missing input" });
      return;
    }

    const product = await Product.findOne({
      _id: productId,
      offers: { $elemMatch: { userId: userId } },
    }).populate<{ vendorId: IVendor }>("vendorId");

    if (!product) {
      res.status(404).json({ success: false, message: "Product not found" });
      return;
    }

    const offer = product.offers.find(
      (o) => o.userId.toString() === userId.toString()
    );

    if (!offer) {
      res.status(404).json({ success: false, message: "Offer not found" });
      return;
    }

    const latestCounterOffer =
      offer.counterOffers?.[offer.counterOffers.length - 1];
    if (latestCounterOffer.rejected) {
      res
        .status(400)
        .json({ success: false, message: "Offer already rejected" });
      return;
    }

    if (latestCounterOffer) latestCounterOffer.rejected = true;

    const productPromise = product.save();

    const notificationPromise = Notification.create({
      userId: userId,
      case: "counter-offer-rejected",
      type: "offer",
      title: `Counter offer rejected for ${product.name}`,
      message: `Counter offer for the ${product.name} was rejected`,
      data: {
        redirectUrl: "/",
        entityId: product._id,
        entityType: "product",
      },
      isRead: false,
    });

    const [_, notification] = await Promise.all([
      productPromise,
      notificationPromise,
    ]);

    await PushNotificationService.notifyVendor(
      product.vendorId.userId.toString(),
      product.vendorId._id!,
      "offer",
      notification
    );

    return res
      .status(200)
      .json({ success: true, message: "Counter Offer rejected" });
  } catch (error) {
    console.error(error);
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

    if (!productId || !userId || typeof maxBid !== "number") {
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