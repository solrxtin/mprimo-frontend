// src/services/product.service.ts
import { ProductType, ReviewDocument, ReviewType } from "../types/product.type";
import ProductModel, { ProductDraft } from "../models/product.model";
import CategoryModel from "../models/category.model";
import createError from "http-errors";
import { MongoError } from "../types/mongo.type";
import Order from "../models/order.model";
import mongoose, { Types } from "mongoose";
import redisService from "./redis.service";
import { IVendor } from "../types/vendor.type";
import Notification from "../models/notification.model";
import { socketService } from "..";
import Vendor from "../models/vendor.model";

function isMongoError(error: any): error is MongoError {
  return error.code !== undefined && typeof error.code === "number";
}

export class ProductService {
  static async getProducts(
    query: any = {},
    page = 1,
    limit = 10,
    sort: any = { createdAt: -1 }
  ) {
    const skip = (page - 1) * limit;

    // Build filter query
    const filter: any = { ...query };

    if (filter.priceRange) {
      const [min, max] = filter.priceRange.split("-");
      filter["price.amount"] = {
        $gte: Number(min),
        $lte: Number(max),
      };
      delete filter.priceRange;
    }

    const [products, total] = await Promise.all([
      ProductModel.find(filter)
        .populate("vendorId", "name email")
        .populate("category.main")
        .populate("category.sub")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      ProductModel.countDocuments(filter),
    ]);

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  static async getProductsByIds(ids: string[]): Promise<ProductType[]> {
    const objectIds = ids.map((id) => new mongoose.Types.ObjectId(id));

    return ProductModel.find({ _id: { $in: objectIds } })
      .populate("vendorId", "name email")
      .populate("category.main")
      .populate("category.sub");
  }

  static async getProductsByVendorId(vendorId: string): Promise<ProductType[]> {
    return ProductModel.find({ vendorId })
      .populate("vendorId", "name email")
      .populate("category.main")
      .populate("category.sub");
  }

  static async getTopProducts(count = 10): Promise<ProductType[]> {
    return ProductModel.find({ status: "active" })
      .sort({ "analytics.views": -1 })
      .limit(count)
      .populate("vendorId", "name email")
      .populate("category.main");
  }

  static async getSimilarProducts(
    productId: string,
    count = 5
  ): Promise<ProductType[]> {
    const product = await ProductModel.findById(productId);
    if (!product) {
      throw createError(404, "Product not found");
    }

    return ProductModel.find({
      _id: { $ne: productId },
      "category.main": product.category.main,
      status: "active",
    })
      .limit(count)
      .populate("vendorId", "name email");
  }

  static async getProductById(id: string): Promise<ProductType> {
    const product = await ProductModel.findById(id)
      .populate("vendorId", "name email")
      .populate("category.main")
      .populate("category.sub");

    if (!product) {
      throw createError(404, "Product not found");
    }
    return product;
  }

  static async getProductBySlug(slug: string): Promise<ProductType> {
    const product = await ProductModel.findOne({ slug })
      .populate("vendorId", "name email")
      .populate("category.main")
      .populate("category.sub");

    if (!product) {
      throw createError(404, "Product not found");
    }
    return product;
  }

  static async getProductsByCategory(categoryId: string, page = 1, limit = 10) {
    // Find the category and its descendants
    const category = await CategoryModel.findById(categoryId);
    if (!category) {
      throw createError(404, "Category not found");
    }

    // Get all products in this category or its subcategories
    const query = {
      $or: [
        { "category.main": categoryId },
        { "category.sub": categoryId },
        { "category.path": { $in: [category.slug] } },
      ],
    };

    return this.getProducts(query, page, limit);
  }

  static async updateProduct(
    id: string,
    vendorId: Types.ObjectId,
    updateData: Partial<ProductType>
  ): Promise<ProductType> {
    // If updating category, validate it exists
    if (updateData.category?.main) {
      const category = await CategoryModel.findById(updateData.category.main);
      if (!category) {
        throw createError(400, "Main category not found");
      }

      // Update category path
      if (!updateData.category.path) {
        updateData.category.path = category.path;
      }
    }

    // If updating subcategories, validate they exist
    if (updateData.category?.sub && updateData.category.sub.length > 0) {
      const subcategories = await CategoryModel.find({
        _id: { $in: updateData.category.sub },
      });

      if (subcategories.length !== updateData.category.sub.length) {
        throw createError(400, "One or more subcategories not found");
      }
    }

    const product = await ProductModel.findOneAndUpdate(
      { _id: id, vendorId },
      updateData,
      { new: true, runValidators: true }
    )
      .populate("vendorId", "name email")
      .populate("category.main")
      .populate("category.sub");

    if (!product) {
      throw createError(404, "Product not found");
    }

    return product;
  }

  static async deleteProduct(
    id: string,
    vendorId: Types.ObjectId
  ): Promise<ProductType> {
    const result = await ProductModel.findOneAndDelete({
      _id: id,
      vendorId,
    }).lean();
    if (!result) {
      throw createError(404, "Product not found");
    }
    return result as ProductType;
  }

  static async updateVariantInventory(
    id: string,
    vendor: IVendor,
    variantId: string, // SKU
    quantity: number,
    operation: "add" | "subtract"
  ): Promise<ProductType> {
    const lock = await redisService.acquireLock(
      id,
      vendor?._id!.toString(),
      10000
    );

    if (!lock) {
      throw createError(
        429,
        "Too many concurrent inventory updates. Please retry."
      );
    }

    const product = await ProductModel.findOne({
      _id: id,
      vendorId: vendor?._id!,
    });
    if (!product) {
      throw createError(404, "Product not found");
    }

    if (!product.variants || product.variants.length === 0) {
      throw createError(400, "Product has no variants to update");
    }

    // Find and update the specific variant option
    let updated = false;
    for (const variant of product.variants) {
      for (const option of variant.options) {
        if (option.sku === variantId) {
          const change = operation === "add" ? quantity : -quantity;
          option.quantity = Math.max(0, option.quantity + change);
          updated = true;
          break;
        }
      }
      if (updated) break;
    }

    if (!updated) {
      throw createError(404, "Variant option not found");
    }

    await product.save();

    // Check for low stock alerts
    const updatedOption = product.variants
      .flatMap((v) => v.options)
      .find((o) => o.sku === variantId);

    if (
      updatedOption &&
      product.inventory?.lowStockAlert &&
      updatedOption.quantity <= product.inventory.lowStockAlert
    ) {
      const notification = await Notification.create({
        userId: vendor.userId,
        message: `${product.name} (${updatedOption.value}) - Only ${updatedOption.quantity} left`,
        title: "Low stock alert",
        type: "product",
        case: "low-stock",
        data: {},
        isRead: false,
      });

      socketService.notifyVendor(vendor?._id!, {
        event: "lowStock",
        notification,
      });
    }

    // Update product status based on total inventory
    const totalQuantity = product.variants
      .flatMap((v) => v.options)
      .reduce((sum, o) => sum + o.quantity, 0);

    if (totalQuantity === 0) {
      product.status = "outOfStock";
      await product.save();
    } else if (product.status === "outOfStock" && totalQuantity > 0) {
      product.status = "active";
      await product.save();
    }

    return product;
  }

  static async addVariant(
    id: string,
    vendorId: Types.ObjectId,
    variantData: ProductType["variants"][0]
  ): Promise<ProductType> {
    const product = await ProductModel.findOneAndUpdate(
      { _id: id, vendorId },
      { $push: { variants: variantData } },
      { new: true, runValidators: true }
    );

    if (!product) {
      throw createError(404, "Product not found");
    }

    return product;
  }

  static async updateAnalytics(
    id: string,
    type: "view" | "purchase" | "addToCart" | "wishlist"
  ): Promise<void> {
    const updateFields: Record<string, number> = {};

    switch (type) {
      case "view":
        updateFields["analytics.views"] = 1;
        break;
      case "purchase":
        updateFields["analytics.purchases"] = 1;
        break;
      case "addToCart":
        updateFields["analytics.addToCart"] = 1;
        break;
      case "wishlist":
        updateFields["analytics.wishlist"] = 1;
        break;
      default:
        throw new Error("Invalid analytics event type");
    }

    const product = await ProductModel.findByIdAndUpdate(
      id,
      { $inc: updateFields },
      { new: true }
    );

    if (!product) return;

    let shouldSave = false;

    if (["view", "purchase"].includes(type)) {
      const { views, purchases } = product.analytics;
      const newRate =
        views > 0 ? parseFloat(((purchases / views) * 100).toFixed(2)) : 0;

      if (product.analytics.conversionRate !== newRate) {
        product.analytics.conversionRate = newRate;
        shouldSave = true;
      }
    }

    // Save if conversion rate changed or if the event is not view/purchase
    if (shouldSave || ["addToCart", "wishlist"].includes(type)) {
      await product.save();
    }
  }

  static async searchProducts(
    query: string,
    filters: any = {},
    page = 1,
    limit = 10
  ) {
    // Get category IDs that match the search query
    const categories = await CategoryModel.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ],
    }).select("_id");

    const categoryIds = categories.map((cat) => cat._id);

    const searchQuery = {
      $or: [
        { name: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
        { "category.main": { $in: categoryIds } },
        { "category.sub": { $in: categoryIds } },
      ],
      ...filters,
    };

    return this.getProducts(searchQuery, page, limit);
  }

  static async addReview(
    id: string,
    reviewData: ReviewType,
    userId: Types.ObjectId,
    vendorRating?: number
  ): Promise<ProductType> {
    const product = await ProductModel.findByIdAndUpdate(
      id,
      { $push: { reviews: reviewData } },
      { new: true, runValidators: true }
    );

    if (!product) {
      throw createError(404, "Product not found");
    }

    if (vendorRating) {
      const vendor = await Vendor.findById(product.vendorId);

      if (!vendor) {
        throw createError(404, "Vendor not found");
      }

      if (!vendor.ratings) {
        vendor.ratings = { average: 0, count: 0 };
      }

      const totalScore = vendor.ratings.average * vendor.ratings.count;
      const newTotalScore = totalScore + vendorRating;
      const newCount = vendor.ratings.count + 1;
      const newAverage = newTotalScore / newCount;

      // Update the ratings
      vendor.ratings.average = newAverage;
      vendor.ratings.count = newCount;

      await vendor.save();
    }

    const order = await Order.findOne({
      userId,
      items: { $elemMatch: { productId: product._id } },
    });

    if (!order) {
      throw createError(
        400,
        "You can only review products that you have purchased"
      );
    }

    if (order.status !== "delivered") {
      throw createError(
        400,
        "You can only review products that's been delivered"
      );
    }

    // Update average rating
    const totalRatings = product.reviews.reduce(
      (sum, review: ReviewType) => sum + review.rating,
      0
    );
    product.rating = totalRatings / product.reviews.length;
    await product.save();

    return product;
  }

  static async getReviews(id: string): Promise<ProductType["reviews"]> {
    const product = await ProductModel.findById(id);

    if (!product) {
      throw createError(404, "Product not found");
    }

    return product.reviews;
  }

  static async getRequiredSpecifications(categoryId: string): Promise<any[]> {
    const category = await CategoryModel.findById(categoryId);
    if (!category) {
      throw createError(404, "Category not found");
    }

    return category.attributes.filter((attr) => attr.required);
  }

  static async saveDraft(draftData: any, userId: Types.ObjectId): Promise<any> {
    try {
      // Generate a unique draft ID if not provided
      if (!draftData.draftId) {
        draftData.draftId = `draft-${Date.now()}`;
      }

      // Find existing draft or create new one
      const draft = await ProductDraft.findOneAndUpdate(
        { draftId: draftData.draftId, userId },
        { ...draftData, userId },
        { new: true, upsert: true }
      );

      return draft;
    } catch (error) {
      console.error("Error saving draft:", error);
      throw error;
    }
  }

  static async getDrafts(userId: Types.ObjectId): Promise<any[]> {
    return ProductDraft.find({ userId }).sort({ lastUpdated: -1 });
  }

  static async updateDraft(
    draftId: string,
    draftData: any,
    userId: Types.ObjectId
  ): Promise<any> {
    const draft = await ProductDraft.findOneAndUpdate(
      { draftId, userId },
      { ...draftData, userId },
      { new: true }
    );

    return draft;
  }

  static async deleteDraft(
    draftId: string,
    userId: Types.ObjectId
  ): Promise<boolean> {
    const result = await ProductDraft.findOneAndDelete({
      draftId,
      userId,
    });

    return !!result;
  }

  static async getBrandsForCategory(filters: {
    category?: string;
    subCategory1?: string;
    subCategory2?: string;
    subCategory3?: string;
    subCategory4?: string;
  }): Promise<string[]> {
    const categoryFilter: any = {};
    if (filters.category) categoryFilter["category.main"] = filters.category;
    if (filters.subCategory1)
      categoryFilter["category.sub"] = { $in: [filters.subCategory1] };
    if (filters.subCategory2)
      categoryFilter["category.sub"] = { $in: [filters.subCategory2] };
    if (filters.subCategory3)
      categoryFilter["category.sub"] = { $in: [filters.subCategory3] };
    if (filters.subCategory4)
      categoryFilter["category.sub"] = { $in: [filters.subCategory4] };

    const brands = await ProductModel.distinct("brand", categoryFilter);
    return brands.filter(Boolean).sort();
  }

  static async getCategoryTree(filters: {
    category?: string;
    subCategory1?: string;
    subCategory2?: string;
    subCategory3?: string;
    subCategory4?: string;
  }): Promise<any[]> {
    const tree = [];

    if (filters.category) {
      const mainCategory = await CategoryModel.findById(
        filters.category
      ).select("name slug");
      if (mainCategory) tree.push(mainCategory);

      if (filters.subCategory1) {
        const sub1 = await CategoryModel.findById(filters.subCategory1).select(
          "name slug"
        );
        if (sub1) tree.push(sub1);

        if (filters.subCategory2) {
          const sub2 = await CategoryModel.findById(
            filters.subCategory2
          ).select("name slug");
          if (sub2) tree.push(sub2);

          if (filters.subCategory3) {
            const sub3 = await CategoryModel.findById(
              filters.subCategory3
            ).select("name slug");
            if (sub3) tree.push(sub3);

            if (filters.subCategory4) {
              const sub4 = await CategoryModel.findById(
                filters.subCategory4
              ).select("name slug");
              if (sub4) tree.push(sub4);
            }
          }
        }
      }
    }

    return tree;
  }
}
