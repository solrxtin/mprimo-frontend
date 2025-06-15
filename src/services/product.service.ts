// src/services/product.service.ts
import { ProductType } from "../types/product.type";
import ProductModel, { ProductDraft } from "../models/product.model";
import CategoryModel from "../models/category.model";
import createError from "http-errors";
import { MongoError } from "../types/mongo.type";
import Order from "../models/order.model";
import mongoose, { Types } from "mongoose";

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
    return ProductModel.find({ _id: { $in: ids } })
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

  static async getSimilarProducts(productId: string, count = 5): Promise<ProductType[]> {
    const product = await ProductModel.findById(productId);
    if (!product) {
      throw createError(404, "Product not found");
    }

    return ProductModel.find({
      _id: { $ne: productId },
      "category.main": product.category.main,
      status: "active"
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

  static async deleteProduct(id: string, vendorId: Types.ObjectId): Promise<void> {
    const result = await ProductModel.findOneAndDelete({ _id: id, vendorId });
    if (!result) {
      throw createError(404, "Product not found");
    }
  }

  static async updateInventory(
    id: string,
    vendorId: Types.ObjectId,
    quantity: number,
    operation: "add" | "subtract"
  ): Promise<ProductType> {
    const update =
      operation === "add"
        ? { $inc: { "inventory.quantity": quantity } }
        : { $inc: { "inventory.quantity": -quantity } };

    const product = await ProductModel.findOneAndUpdate(
      { _id: id, vendorId },
      update,
      { new: true, runValidators: true }
    );

    if (!product) {
      throw createError(404, "Product not found");
    }

    // Check if inventory is below lowStockAlert
if (
  product.inventory?.lowStockAlert !== undefined && 
  product.inventory.listing?.type === "instant" &&
  product.inventory.listing.instant?.quantity !== undefined &&
  product.inventory.listing.instant.quantity <= product.inventory.lowStockAlert
) {
  // Implement low stock notification logic here
  console.log(`Low stock alert for product ${product.name}`);
}

// Update status if out of stock
if (
  (product.inventory.listing?.type === "auction" && 
   product.inventory.listing.auction?.quantity === 0) || 
  (product.inventory.listing?.type === "instant" && 
   product.inventory.listing.instant?.quantity === 0)
) {
  product.status = "outOfStock";
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
    type: "view" | "purchase"
  ): Promise<void> {
    const update: any = {
      $inc: {
        "analytics.views": type === "view" ? 1 : 0,
        "analytics.purchases": type === "purchase" ? 1 : 0,
      },
    };

    const product = await ProductModel.findByIdAndUpdate(id, update, {
      new: true,
    });

    if (product) {
      // Update conversion rate
      product.analytics.conversionRate =
        product.analytics.purchases / product.analytics.views || 0;
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

  static async addReview(
    id: string,
    reviewData: ProductType["reviews"][0],
    userId: Types.ObjectId
  ): Promise<ProductType> {
    const product = await ProductModel.findByIdAndUpdate(
      id,
      { $push: { reviews: reviewData } },
      { new: true, runValidators: true }
    );

    if (!product) {
      throw createError(404, "Product not found");
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
      (sum, review) => sum + review.rating,
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

    return category.attributes.filter(attr => attr.required);
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
    return ProductDraft.find({ userId })
      .sort({ lastUpdated: -1 });
  }

  static async updateDraft(draftId: string, draftData: any, userId: Types.ObjectId): Promise<any> {
    const draft = await ProductDraft.findOneAndUpdate(
      { draftId, userId },
      { ...draftData, userId },
      { new: true }
    );

    return draft;
  }

  static async deleteDraft(draftId: string, userId: Types.ObjectId): Promise<boolean> {
    const result = await ProductDraft.findOneAndDelete({
      draftId,
      userId
    });

    return !!result;
  }

  static async createOrder(
    userId: Types.ObjectId,
    items: Array<{ productId: string; quantity: number; price: number }>,
    shippingAddress: any,
    paymentMethod: string
  ): Promise<any> {
    // This is a placeholder for order creation
    // Implement the actual order creation logic here
    
    // Update product inventory
    for (const item of items) {
      await this.updateInventory(
        item.productId,
        userId, // This might need adjustment based on the implementation
        item.quantity,
        "subtract"
      );
    }

    // Create order record
    const order = await Order.create({
      userId: new mongoose.Types.ObjectId(userId),
      items: items.map(item => ({
        productId: new mongoose.Types.ObjectId(item.productId),
        quantity: item.quantity,
        price: item.price
      })),
      shippingAddress,
      paymentMethod,
      status: "processing",
      totalAmount: items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    });

    return order;
  }
}