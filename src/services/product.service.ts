// src/services/product.service.ts
import { Product } from "../types/product.type";
import ProductModel from "../models/product.model";
import createError from "http-errors";
import { MongoError } from "../types/mongo.type";
import Order from "../models/order.model";

function isMongoError(error: any): error is MongoError {
  return error.code !== undefined && typeof error.code === "number";
}

export class ProductService {
  static async createProduct(productData: Partial<Product>): Promise<Product> {
    try {
      // Validate SKU uniqueness
      const existingSku = await ProductModel.findOne({
        "inventory.sku": productData.inventory?.sku,
      });

      if (existingSku) {
        throw createError(409, "Product with this SKU already exists");
      }

      const product = await ProductModel.create(productData);
      return product;
    } catch (error) {
      if (isMongoError(error) && error.code === 11000) {
        // Handle duplicate key error
        const field = Object.keys(error.keyPattern || {})[0] || "field";
        throw createError(409, `Duplicate ${field} found`);
      }
      throw error;
    }
  }

  static async getProducts(
    query: any = {},
    page = 1,
    limit = 10,
    sort: any = { createdAt: -1 }
  ) {
    const skip = (page - 1) * limit;

    // Build filter query
    const filter: any = { ...query };

    if (filter.category) {
      filter["category.main"] = filter.category;
      delete filter.category;
    }

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

  static async getProductById(id: string): Promise<Product> {
    const product = await ProductModel.findById(id).populate(
      "vendorId",
      "name email"
    );

    if (!product) {
      throw createError(404, "Product not found");
    }
    return product;
  }

  static async updateProduct(
    id: string,
    vendorId: string,
    updateData: Partial<Product>
  ): Promise<Product> {
    const product = await ProductModel.findOneAndUpdate(
      { _id: id, vendorId },
      updateData,
      { new: true, runValidators: true }
    ).populate("vendorId", "name email");

    if (!product) {
      throw createError(404, "Product not found");
    }

    return product;
  }

  static async deleteProduct(id: string, vendorId: string): Promise<void> {
    const result = await ProductModel.findOneAndDelete({ _id: id, vendorId });
    if (!result) {
      throw createError(404, "Product not found");
    }
  }

  static async updateInventory(
    id: string,
    vendorId: string,
    quantity: number,
    operation: "add" | "subtract"
  ): Promise<Product> {
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
    if (product.inventory.quantity <= product.inventory.lowStockAlert) {
      // Implement low stock notification logic here
      console.log(`Low stock alert for product ${product.name}`);
    }

    // Update status if out of stock
    if (product.inventory.quantity === 0) {
      product.status = "outOfStock";
      await product.save();
    }

    return product;
  }

  static async addVariant(
    id: string,
    vendorId: string,
    variantData: Product["variants"][0]
  ): Promise<Product> {
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
    const searchQuery = {
      $or: [
        { name: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
        { "category.main": { $regex: query, $options: "i" } },
        { "category.sub": { $regex: query, $options: "i" } },
      ],
      ...filters,
    };

    return this.getProducts(searchQuery, page, limit);
  }

  static async addReview(
    id: string,
    reviewData: Product["reviews"][0],
    userId: string
  ): Promise<Product> {
    const product = await ProductModel.findByIdAndUpdate(
      id,
      { $push: { reviews: reviewData } },
      { new: true, runValidators: true }
    );

    if (!product) {
      throw createError(404, "Product not found");
    }

    const order = await Order.findOne({ userId: userId,
      items: { $elemMatch: { productId: product._id }} });
    console.log("Order is: ", order)

    if (!order) {
      throw createError(400, "You can only review products that you have purchased");
    }

    if (order.status !== "delivered") {
      throw createError(400, "You can only review products that's been delivered");
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
  static async getReviews(id: string): Promise<Product["reviews"]> {
    const product = await ProductModel.findById(id);

    if (!product) {
      throw createError(404, "Product not found");
    }

    return product.reviews;
  }
}
