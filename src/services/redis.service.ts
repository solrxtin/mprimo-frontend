// src/services/redis.service.ts
import Redis from "ioredis";
import { scheduleJob } from "node-schedule";
import ProductModel from "../models/product.model";
import AnalyticsModel from "../models/analytics.model";
import mongoose, { Types } from "mongoose";
import dotenv from "dotenv";
import { LoggerService } from "./logger.service";
import { CartItem } from "../types/cart.type";
import Notification from "../models/notification.model";
import pushNotificationService, { PushNotificationService } from "./push-notification.service";
import { socketService } from "..";
import { ProductType } from "../types/product.type";

dotenv.config();
const logger = LoggerService.getInstance();

class RedisService {
  public redisClient; // Make public for rate limiting middleware
  private readonly ANALYTICS_CHANNEL = "product_analytics";
  private readonly INVENTORY_CHANNEL = "inventory_alerts";
  private isConnected = false;

  constructor() {
    this.redisClient = new Redis(process.env.UPSTASH_REDIS_REST_URL!);

    this.redisClient.on("error", (err) => {
      logger.error("Redis Client Error", err);
      console.error("Redis Client Error", err);
    });

    this.redisClient.on("connect", () => {
      logger.info("Connected to Redis");
      console.log("Connected to Redis");
      this.isConnected = true;
    });

    this.setUpScheduledTasks();
    this.subscribeToChannels();
  }

  private async subscribeToChannels() {
    try {
      // For Upstash Redis, we need a separate client for pub/sub
      const subscriber = new Redis(process.env.UPSTASH_REDIS_REST_URL!);

      // Subscribe to inventory alerts
      await subscriber.subscribe(this.INVENTORY_CHANNEL, (err, count) => {
        if (err) {
          logger.error("Failed to subscribe to channel", err);
          return;
        }
        logger.info(`Subscribed to ${count} channels`);
      });

      subscriber.on("message", (channel, message) => {
        if (channel === this.INVENTORY_CHANNEL) {
          try {
            const alert = JSON.parse(message);
            logger.warn(
              `Low inventory alert: Product ${alert.productId} has only ${alert.count} items left`
            );
          } catch (error) {
            logger.error("Error processing inventory alert", error);
          }
        }
      });
    } catch (error) {
      logger.error("Error setting up Redis subscriptions", error);
    }
  }

  // ==================== PRODUCT CACHING ====================
  async getProductWithCache(options: { id?: string; slug?: string }) {
    const { id, slug } = options;

    try {
      const cacheKey = id ? `product:${id}` : `product:slug:${slug}`;
      const cachedProduct = await this.redisClient.get(cacheKey);

      if (cachedProduct) {
        return JSON.parse(cachedProduct);
      }

      const product = id
        ? await ProductModel.findById(id)
            .populate({
              path: "category.main",
              select: "name slug",
            })
            .populate({
              path: "category.sub",
              select: "name slug",
            })
            .populate({
              path: "country",
              select: "name currency",
            })
        : await ProductModel.findOne({ slug })
            .populate({
              path: "category.main",
              select: "name slug",
            })
            .populate({
              path: "category.sub",
              select: "name slug",
            })
            .populate({
              path: "country",
              select: "name currency",
            });

      if (product) {
        // Cache using both ID and slug for flexibility
        await this.redisClient.set(
          `product:${product._id}`,
          JSON.stringify(product),
          "EX",
          3600
        );

        if (product.slug) {
          await this.redisClient.set(
            `product:slug:${product.slug}`,
            JSON.stringify(product),
            "EX",
            3600
          );
        }
      }

      return product;
    } catch (error) {
      logger.error("Redis cache error:", error);
      return id
        ? await ProductModel.findById(id)
        : await ProductModel.findOne({ slug });
    }
  }

  async invalidateProductCache(options: { id?: string; slug?: string }) {
    if (!this.isConnected) return;

    const { id, slug } = options;

    try {
      // Invalidate by ID if provided
      if (id) {
        await this.redisClient.del(`product:${id}`);
      }

      // Invalidate by slug if provided
      if (slug) {
        await this.redisClient.del(`product:slug:${slug}`);
      }
    } catch (error) {
      logger.error("Redis cache invalidation error:", error);
    }
  }

  // ==================== ANALYTICS TRACKING ====================
  async trackEvent(
    entityId: string,
    eventType: "view" | "click" | "addToCart" | "wishlist" | "purchase",
    userId?: Types.ObjectId,
    amount?: number
  ) {
    if (!this.isConnected) return;

    try {
      const event = {
        entityId,
        eventType,
        userId: userId || "anonymous",
        amount: amount || 0,
        timestamp: Date.now(),
      };

      // Publish event to Redis
      await this.redisClient.publish(
        this.ANALYTICS_CHANNEL,
        JSON.stringify(event)
      );

      // Increment counter in Redis
      const key = `analytics:${eventType}:${entityId}`;
      await this.redisClient.incr(key);

      // If it's a purchase, track revenue
      if (eventType === "purchase" && amount) {
        const revenueKey = `analytics:revenue:${entityId}`;
        await this.redisClient.incrby(revenueKey, Math.round(amount * 100)); // Store as cents
      }

      // Track in leaderboard
      if (eventType === "view") {
        await this.redisClient.zincrby("popular:products", 1, entityId);
      }
    } catch (error) {
      logger.error("Error tracking event:", error);
    }
  }

  // ==================== REAL-TIME INVENTORY ====================
  async updateInventory(productId: string, change: number) {
    if (!this.isConnected) return;

    try {
      const key = `inventory:${productId}`;
      const newCount = await this.redisClient.incrby(key, change);

      // Get low stock threshold from product
      const product = await ProductModel.findById(productId);
      const threshold = product?.inventory?.lowStockAlert || 5;

      // If inventory drops below threshold, publish alert
      if (newCount <= threshold) {
        await this.redisClient.publish(
          this.INVENTORY_CHANNEL,
          JSON.stringify({
            productId,
            count: newCount,
          })
        );
      }

      return newCount;
    } catch (error) {
      logger.error("Error updating inventory:", error);
    }
  }

  async getInventory(productId: string) {
    if (!this.isConnected) return null;

    try {
      const key = `inventory:${productId}`;
      const count = await this.redisClient.get(key);
      return count ? parseInt(count) : null;
    } catch (error) {
      logger.error("Error getting inventory:", error);
      return null;
    }
  }

  // ==================== CART MANAGEMENT ======================
  async addToCart(
    userId: string,
    productId: string,
    quantity: number,
    price: number,
    selectedVariant?: string
  ) {
    if (!this.isConnected) return;

    try {
      const cartKey = `cart:${userId}`;
      const cartItemRaw = await this.redisClient.hget(cartKey, productId);

      let newItem: CartItem;

      if (cartItemRaw) {
        const existingItem: CartItem = JSON.parse(cartItemRaw);
        newItem = {
          ...existingItem,
          quantity: existingItem.quantity + quantity,
          price, // Optionally update price in case it's changed
          variantId: selectedVariant ?? existingItem.variantId,
          addedAt: existingItem.addedAt
            ? new Date(existingItem.addedAt)
            : new Date(),
        };
      } else {
        newItem = {
          productId: new mongoose.Types.ObjectId(productId),
          variantId: selectedVariant || '',
          quantity,
          price,
          addedAt: new Date(),
        };
      }

      await this.redisClient.hset(cartKey, productId, JSON.stringify(newItem));
    } catch (error) {
      logger.error("Error adding to cart:", error);
    }
  }

  async getCart(userId: string) {
    if (!this.isConnected) return [];

    try {
      const cartKey = `cart:${userId}`;
      const cartItems = await this.redisClient.hgetall(cartKey);
      return Object.values(cartItems)
        .map((item) => JSON.parse(item))
        .sort(
          (a, b) =>
            new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
        );
    } catch (error) {
      logger.error("Error getting cart:", error);
      return [];
    }
  }

  async removeFromCart(userId: string, productId: string) {
    if (!this.isConnected) return;

    try {
      const cartKey = `cart:${userId}`;
      await this.redisClient.hdel(cartKey, productId);
    } catch (error) {
      logger.error("Error removing from cart:", error);
    }
  }

  async clearCart(userId: string) {
    if (!this.isConnected) return;
    try {
      await this.redisClient.del(`cart:${userId}`);
    } catch (error) {
      logger.error("Error clearing cart:", error);
    }
  }

  // ==================== WISHLIST ====================
  async addToWishlist(userId: string, productId: string) {
    if (!this.isConnected) return;

    try {
      const wishlistKey = `wishlist:${userId}`;
      await this.redisClient.sadd(wishlistKey, productId);
    } catch (error) {
      logger.error("Error adding to wishlist:", error);
    }
  }

  async getWishlist(userId: string) {
    if (!this.isConnected) return [];

    try {
      const wishlistKey = `wishlist:${userId}`;
      const wishlist = await this.redisClient.smembers(wishlistKey);
      return wishlist;
    } catch (error) {
      logger.error("Error getting wishlist:", error);
      return [];
    }
  }

  async removeFromWishlist(userId: string, productId: string) {
    if (!this.isConnected) return;

    try {
      const wishlistKey = `wishlist:${userId}`;
      await this.redisClient.srem(wishlistKey, productId);
    } catch (error) {
      logger.error("Error removing from wishlist:", error);
    }
  }

  async clearWishlist(userId: string) {
    if (!this.isConnected) return;
    try {
      await this.redisClient.del(`wishlist:${userId}`);
    } catch (error) {
      logger.error("Error clearing wishlist:", error);
    }
  }

  // ==================== SEARCH SUGGESTIONS ====================
  async indexProduct(product: any) {
    if (!this.isConnected) return;

    try {
      const words =
        `${product.name} ${product.description}`
          .toLowerCase()
          .match(/\b(\w{3,})\b/g) || [];

      const phrases = [];
      for (let i = 0; i < words.length - 1; i++) {
        phrases.push(`${words[i]} ${words[i + 1]}`);
      }

      for (const term of [...words, ...phrases]) {
        if (term.length > 2) {
          await this.redisClient.zincrby("search:suggestions", 1, term);
        }
      }
    } catch (error) {
      logger.error("Error indexing product:", error);
    }
  }

  async getSuggestions(prefix: string, limit = 5) {
    if (!this.isConnected) return [];

    try {
      // For Upstash Redis, we need to use a different approach since zrangebylex might not be fully supported
      const allSuggestions = await this.redisClient.zrange(
        "search:suggestions",
        0,
        -1,
        "WITHSCORES"
      );

      // Filter and sort suggestions manually
      const filteredSuggestions = [];
      for (let i = 0; i < allSuggestions.length; i += 2) {
        const word = allSuggestions[i];
        const score = parseInt(allSuggestions[i + 1]);

        if (
          typeof word === "string" &&
          word.toLowerCase().startsWith(prefix.trim().toLowerCase())
        ) {
          filteredSuggestions.push({ word, score });
        }
      }

      // Sort by score and take top results
      return filteredSuggestions
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((item) => item.word);
    } catch (error) {
      logger.error("Error getting suggestions:", error);
      return [];
    }
  }

  // ==================== LEADERBOARDS ====================
  async getTopProducts(count = 10) {
    if (!this.isConnected) return [];

    try {
      return this.redisClient.zrevrange(
        "popular:products",
        0,
        count - 1,
        "WITHSCORES"
      );
    } catch (error) {
      logger.error("Error getting top products:", error);
      return [];
    }
  }

  // ==================== DISTRIBUTED LOCKS ====================
  async acquireLock(resourceId: string, ownerId: string, expirySeconds = 30) {
    if (!this.isConnected) return false;

    try {
      const key = `lock:${resourceId}`;
      const result = await this.redisClient.set(
        key,
        ownerId,
        "EX",
        expirySeconds,
        "NX"
      );
      return result === "OK";
    } catch (error) {
      logger.error("Error acquiring lock:", error);
      return false;
    }
  }

  async releaseLock(resourceId: string, ownerId: string) {
    if (!this.isConnected) return false;

    try {
      const key = `lock:${resourceId}`;
      const currentOwner = await this.redisClient.get(key);

      if (currentOwner === ownerId) {
        await this.redisClient.del(key);
        return true;
      }

      return false;
    } catch (error) {
      logger.error("Error releasing lock:", error);
      return false;
    }
  }

  // ==================== RECOMMENDATION ENGINE ====================
  async trackRelatedPurchase(productA: ProductType, productB: ProductType) {
    if (!this.isConnected) return;
  
    try {
      let score = 1;
  
      if (productA.category.main.toString() === productB.category.main.toString()) score += 2;
      if (productA.brand === productB.brand) score += 2;
  
      // Prevent noisy associations
      if (score < 2) return;
  
      await this.redisClient.zincrby(`related:${productA._id!.toString()}`, score, productB._id!.toString());
      await this.redisClient.zincrby(`related:${productB._id!.toString()}`, score, productA._id!.toString());
    } catch (error) {
      logger.error("Error tracking related purchase:", error);
    }
  }

  async getRelatedProducts(productId: string, count = 5) {
    if (!this.isConnected) return [];

    try {
      return this.redisClient.zrevrange(`related:${productId}`, 0, count - 1);
    } catch (error) {
      logger.error("Error getting related products:", error);
      return [];
    }
  }

  // ==================== SESSION MANAGEMENT ====================
  async storeSession(userId: string, sessionData: any, expirySeconds = 86400) {
    if (!this.isConnected) return false;

    try {
      const key = `session:${userId}`;
      await this.redisClient.set(
        key,
        JSON.stringify(sessionData),
        "EX",
        expirySeconds
      );
      return true;
    } catch (error) {
      logger.error("Error storing session:", error);
      return false;
    }
  }

  async getSession(userId: string) {
    if (!this.isConnected) return null;

    try {
      const key = `session:${userId}`;
      const session = await this.redisClient.get(key);
      return session ? JSON.parse(session) : null;
    } catch (error) {
      logger.error("Error getting session:", error);
      return null;
    }
  }

  // ==================== A/B TESTING ====================
  async assignTestGroup(userId: string, test: string) {
    if (!this.isConnected) return Math.random() > 0.5 ? "A" : "B";

    try {
      const key = `abtest:${test}`;
      let group = await this.redisClient.hget(key, userId);

      if (!group) {
        group = Math.random() > 0.5 ? "A" : "B";
        await this.redisClient.hset(key, userId, group);
      }

      return group;
    } catch (error) {
      logger.error("Error assigning test group:", error);
      return Math.random() > 0.5 ? "A" : "B";
    }
  }

  // ==================== BATCH PROCESSING ====================
  private setUpScheduledTasks() {
    // Process analytics every hour
    scheduleJob("0 * * * *", async () => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Process views
        await this.processMetric("view", today);

        // Process clicks
        await this.processMetric("click", today);

        // Process add to cart
        await this.processMetric("addToCart", today);

        // Process wishlist
        await this.processMetric("wishlist", today);

        // Process purchases
        await this.processMetric("purchase", today);

        // Process revenue
        await this.processRevenue(today);

        logger.info("Analytics batch processing completed");
      } catch (error) {
        logger.error("Error in batch processing:", error);
      }
    });

    scheduleJob("* * * * *", async () => {
      await this.startAuction();
      await this.endAuction();
    });
  }

  private async processMetric(metricType: string, date: Date) {
    if (!this.isConnected) return;

    try {
      const keys = await this.redisClient.keys(`analytics:${metricType}:*`);

      for (const key of keys) {
        const entityId = key.split(":")[2];
        const count = await this.redisClient.get(key);

        if (count && parseInt(count) > 0) {
          // Update analytics in database
          await this.updateAnalytics(
            entityId,
            "product",
            metricType,
            parseInt(count),
            date
          );
          // Delete the key after processing
          await this.redisClient.del(key);
        }
      }
    } catch (error) {
      logger.error(`Error processing ${metricType} metrics:`, error);
    }
  }

  private async processRevenue(date: Date) {
    if (!this.isConnected) return;

    try {
      const keys = await this.redisClient.keys("analytics:revenue:*");

      for (const key of keys) {
        const entityId = key.split(":")[2];
        const revenue = await this.redisClient.get(key);

        if (revenue && parseInt(revenue) > 0) {
          // Convert from cents back to dollars
          const revenueAmount = parseInt(revenue) / 100;
          // Update revenue in database
          await this.updateAnalytics(
            entityId,
            "product",
            "revenue",
            revenueAmount,
            date
          );
          // Delete the key after processing
          await this.redisClient.del(key);
        }
      }
    } catch (error) {
      logger.error("Error processing revenue:", error);
    }
  }

  private async updateAnalytics(
    entityId: string,
    entityType: "product" | "vendor" | "category",
    metricType: string,
    value: number,
    date: Date
  ) {
    try {
      // Find or create daily analytics record
      const filter = {
        entityId: new mongoose.Types.ObjectId(entityId),
        entityType,
        timeframe: "daily",
        date: {
          $gte: new Date(date.setHours(0, 0, 0, 0)),
          $lt: new Date(date.setHours(23, 59, 59, 999)),
        },
      };

      const update: any = { $inc: {} };

      if (metricType === "view") update.$inc["metrics.views"] = value;
      else if (metricType === "click") update.$inc["metrics.clicks"] = value;
      else if (metricType === "addToCart")
        update.$inc["metrics.addToCart"] = value;
      else if (metricType === "wishlist")
        update.$inc["metrics.wishlist"] = value;
      else if (metricType === "purchase")
        update.$inc["metrics.purchases"] = value;
      else if (metricType === "revenue") update.$inc["metrics.revenue"] = value;

      if (
        entityType === "product" &&
        (metricType === "view" || metricType === "purchase")
      ) {
        const product = await ProductModel.findById(entityId).select(
          "analytics.views analytics.purchases"
        );

        if (product) {
          const { views, purchases } = product.analytics;
          const rate =
            views > 0 ? parseFloat(((purchases / views) * 100).toFixed(2)) : 0;
          await ProductModel.updateOne(
            { _id: entityId },
            { $set: { "analytics.conversionRate": rate } }
          );
        }
      }

      await AnalyticsModel.findOneAndUpdate(filter, update, { upsert: true });
    } catch (error) {
      logger.error("Error updating analytics:", error);
    }
  }

  private async startAuction() {
    try {
      const now = new Date();

      const productsToStart = await ProductModel.find({
        "inventory.listing.auction.startTime": { $lte: now },
        "inventory.listing.auction.isStarted": false,
        "inventory.listing.type": "auction",
      });

      if (productsToStart.length > 0) {
        await Promise.all(
          productsToStart.map(async (product) => {
            product.inventory.listing.auction!.isStarted = true;
            await product.save();

            socketService.emitToRoom(
              product._id.toString(),
              "auction:started",
              {
                productId: product._id,
                startTime: product.inventory.listing.auction!.startTime,
              }
            );

            logger.info(`Auction started for product: ${product._id}`);
          })
        );
      }
    } catch (error) {
      logger.error("Error starting auctions:", error);
    }
  }
  private async endAuction() {
    try {
      const now = new Date();

      const productsToExpire = await ProductModel.find({
        "inventory.listing.type": "auction",
        "inventory.listing.auction.isStarted": true,
        "inventory.listing.auction.isExpired": false,
        "inventory.listing.auction.endTime": { $lte: now },
      });

      if (productsToExpire.length > 0) {
        await Promise.all(
          productsToExpire.map(async (product) => {
            const auction = product.inventory.listing.auction;

            if (auction && auction.isExpired) {
              auction.isExpired = true;
            }

            // Notify winner (if any)
            const winner = product.bids.find((bid) => bid.isWinning);
            if (winner) {
              const [notification] = await Notification.create([
                {
                  userId: winner.userId,
                  type: "bid",
                  case: "win",
                  title: `You won the auction for ${product.name}`,
                  message: `Your bid of $${winner.currentAmount} won the auction.`,
                  data: {
                    redirectUrl: `/product/${product._id}`,
                    entityId: product._id,
                    entityType: "product",
                  },
                  isRead: false,
                },
              ]);

              await PushNotificationService.notifyUser(
                winner.userId.toString(),
                "bid",
                notification
              );
            }

            await product.save();

            socketService.emitToRoom(
              product._id.toString(),
              "auction:expired",
              {
                productId: product._id,
                expiredAt: now,
                winner: winner?.userId ?? null,
              }
            );

            logger.info(`Auction expired for product ${product._id}`);
          })
        );
      }
    } catch (error) {
      logger.error("Error expiring auctions:", error);
    }
  }
}

// Export as singleton
export default new RedisService();
