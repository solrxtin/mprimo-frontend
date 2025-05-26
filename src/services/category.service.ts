// src/services/category.service.ts
import CategoryModel, { ICategory } from "../models/category.model";
import createError from "http-errors";
import mongoose from "mongoose";
import { MongoError } from "../types/mongo.type";

function isMongoError(error: any): error is MongoError {
  return error.code !== undefined && typeof error.code === "number";
}

export class CategoryService {
  static async createCategory(
    categoryData: Partial<ICategory>,
    userId: string
  ): Promise<ICategory> {
    try {
      const category = await CategoryModel.create({
        ...categoryData,
        createdBy: userId,
        updatedBy: userId,
      });

      return category;
    } catch (error) {
      if (isMongoError(error) && error.code === 11000) {
        // Handle duplicate key error
        const field = Object.keys(error.keyPattern || {})[0] || "field";
        throw createError(409, `Duplicate ${field} found`);
      }
      throw error;
    }
  }

  static async updateCategory(
    id: string,
    updateData: Partial<ICategory>,
    userId: string
  ): Promise<ICategory> {
    const category = await CategoryModel.findByIdAndUpdate(
      id,
      {
        ...updateData,
        updatedBy: userId,
      },
      { new: true, runValidators: true }
    );

    if (!category) {
      throw createError(404, "Category not found");
    }

    return category;
  }
  static async getCategories(
    limit: number,
    page: number
  ): Promise<{ categories: ICategory[]; total: number }> {
    const categories = await CategoryModel.find()
      // .limit(limit)
      // .skip((page - 1) * limit)
      // .populate("parent", "name slug")
      // .populate("children", "name slug");

    const total = await CategoryModel.countDocuments();
    if (!categories) {
      throw createError(404, "No categories found");
    }

    return { categories, total };
  }

  static async deleteCategory(id: string): Promise<void> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Check if category has children
      const hasChildren = await CategoryModel.exists({ parent: id });
      if (hasChildren) {
        throw createError(400, "Cannot delete category with subcategories");
      }

      // Check if category is used in products
      // Assuming you have a Product model with a category field
      const isUsed = await mongoose.model("Product").exists({
        "category.main": id,
      });
      if (isUsed) {
        throw createError(400, "Cannot delete category used by products");
      }

      const result = await CategoryModel.findByIdAndDelete(id);
      if (!result) {
        throw createError(404, "Category not found");
      }

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async getCategory(id: string): Promise<ICategory> {
    const category = await CategoryModel.findById(id)
      .populate("children")
      .populate("parent", "name slug");

    if (!category) {
      throw createError(404, "Category not found");
    }

    return category;
  }

  static async getCategoryBySlug(slug: string): Promise<ICategory> {
    const category = await CategoryModel.findOne({ slug })
      .populate("children")
      .populate("parent", "name slug");

    if (!category) {
      throw createError(404, "Category not found");
    }

    return category;
  }

  static async getCategoryTree(parentId?: string): Promise<ICategory[]> {
    const query = parentId ? { parent: parentId } : { parent: null };

    const categories = await CategoryModel.find(query).populate({
      path: "children",
      populate: {
        path: "children",
      },
    });

    return categories;
  }

  static async getCategoryPath(id: string): Promise<ICategory[]> {
    const category = await CategoryModel.findById(id);
    if (!category) {
      throw createError(404, "Category not found");
    }

    const path = await CategoryModel.find({
      slug: { $in: category.path },
    }).sort({ level: 1 });

    return path;
  }

  static async addAttribute(
    id: string,
    attribute: ICategory["attributes"][0]
  ): Promise<ICategory> {
    const category = await CategoryModel.findByIdAndUpdate(
      id,
      {
        $push: { attributes: attribute },
      },
      { new: true, runValidators: true }
    );

    if (!category) {
      throw createError(404, "Category not found");
    }

    return category;
  }

  static async removeAttribute(
    id: string,
    attributeName: string
  ): Promise<ICategory> {
    const category = await CategoryModel.findByIdAndUpdate(
      id,
      {
        $pull: { attributes: { name: attributeName } },
      },
      { new: true }
    );

    if (!category) {
      throw createError(404, "Category not found");
    }

    return category;
  }

  static async searchCategories(
    query: string,
    limit = 10
  ): Promise<ICategory[]> {
    return CategoryModel.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ],
    })
      .limit(limit)
      .populate("parent", "name slug");
  }
}
