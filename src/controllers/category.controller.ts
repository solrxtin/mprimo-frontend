import { Request, Response, NextFunction } from "express";
import { CategoryService } from "../services/category.service";
import CategoryModel from "../models/category.model";
/**
 * Validates category data before creation or update
 * @param data Category data to validate
 * @param isUpdate Whether this is an update operation (some fields optional)
 * @returns Promise that resolves if validation ,
 */
async function validateCategory(
  data: any,
  isUpdate: boolean = false
): Promise<string[]> {
  const errors: string[] = [];

  // Sanitize parent field - convert empty string to null
  if (data.parent === '' || data.parent === undefined) {
    data.parent = null;
  }

  // Required fields for creation
  if (!isUpdate && !data.name) {
    errors.push("Category name is required");
  }

  // Validate name format if provided
  if (
    data.name &&
    (typeof data.name !== "string" || data.name.trim().length < 2)
  ) {
    errors.push("Category name must be at least 2 characters");
  }

  // Validate parent exists if provided (skip if null for level 1 categories)
  if (data.parent !== null) {
    try {
      const parentExists = await CategoryService.categoryExists(data.parent);
      if (!parentExists) {
        errors.push("Parent category does not exist");
      }
    } catch (error) {
      errors.push("Invalid parent category ID");
    }
  }

  if (!data.productDimensionsRequired) {
    data.productDimensionsRequired = false;
  } else if (typeof data.productDimensionsRequired !== "boolean") {
    errors.push("productDimensionsRequired must be a boolean");
  }

  if (!data.productWeightRequired) {
    data.productWeightRequired = false;
  } else if (typeof data.productWeightRequired !== "boolean") {
    errors.push("productWeightRequired must be a boolean");
  }

  // Validate attributes if provided
  if (data.attributes) {
    if (!Array.isArray(data.attributes)) {
      errors.push("Attributes must be an array");
    } else {
      data.attributes.forEach((attr: any, index: number) => {
        if (!attr.name) {
          errors.push(`Attribute at index ${index} is missing a name`);
        }

        if (
          !attr.type ||
          !["text", "number", "boolean", "select"].includes(attr.type)
        ) {
          errors.push(`Attribute "${attr.name || index}" has invalid type`);
        }

        if (
          attr.type === "select" &&
          (!attr.options ||
            !Array.isArray(attr.options) ||
            attr.options.length === 0)
        ) {
          errors.push(
            `Select attribute "${attr.name || index}" must have options array`
          );
        }
      });
    }
  }

  // Validate image URL if provided
  if (data.image && typeof data.image === "string") {
    const urlPattern = /^https?:\/\/.+/;
    if (!urlPattern.test(data.image)) {
      errors.push("Image must be a valid URL");
    }
  }

  return errors;
}

export class CategoryController {
  static async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate category data
      const validationErrors = await validateCategory(req.body, false);
      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validationErrors,
        });
      }

      const category = await CategoryService.createCategory(
        req.body,
        req.userId!.toString()
      );

      return res.status(201).json({
        success: true,
        message: "Category created successfully",
        category,
      });
    } catch (error: any) {
      return res.status(error.status || 500).json({
        success: false,
        message: error.message || "Failed to create category",
      });
    }
  }

  static async updateCategory(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate category data for update
      const validationErrors = await validateCategory(req.body, true);
      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validationErrors,
        });
      }

      const category = await CategoryService.updateCategory(
        req.params.id,
        req.body,
        req.userId!.toString()
      );

      return res.json({
        success: true,
        message: "Category updated successfully",
        category,
      });
    } catch (error: any) {
      return res.status(error.status || 500).json({
        success: false,
        message: error.message || "Failed to update category",
      });
    }
  }

  static async deleteCategory(req: Request, res: Response, next: NextFunction) {
    try {
      await CategoryService.deleteCategory(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  static async getCategory(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.params.id) {
        return res.status(400).json({
          success: false,
          message: "Category ID is required",
        });
      }
      const category = await CategoryService.getCategory(req.params.id);
      res.json({ category });
    } catch (error) {
      next(error);
    }
  }

  static async getCategoryBySlug(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const slug = req.params.slug;
      if (!slug) {
        return res.status(400).json({
          success: false,
          message: "Category slug is required",
        });
      }
      const category = await CategoryService.getCategoryBySlug(req.params.slug);
      res.json({ category });
    } catch (error) {
      next(error);
    }
  }

  static async getCategoryTree(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.query.parentId) {
        return res.status(400).json({
          success: false,
          message: "Invalid request. parentId is required",
        });
      }
      const categories = await CategoryService.getCategoryTree(
        req.query.parentId as string
      );
      res.json({ categories });
    } catch (error) {
      next(error);
    }
  }

  static async getCategoryPath(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.params.id) {
        return res.status(400).json({
          success: false,
          message: "Category ID is required",
        });
      }
      const path = await CategoryService.getCategoryPath(req.params.id);
      res.json({ path });
    } catch (error) {
      next(error);
    }
  }

  static async addAttribute(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await CategoryService.addAttribute(
        req.params.id,
        req.body
      );
      res.json({ category });
    } catch (error) {
      next(error);
    }
  }

  static async removeAttribute(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const category = await CategoryService.removeAttribute(
        req.params.id,
        req.params.attributeName
      );
      res.json({ category });
    } catch (error) {
      next(error);
    }
  }

  static async searchCategories(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const query = (req.query.q as string)?.trim();
      const limit = Number(req.query.limit) || 10;

      if (!query || query.length < 2) {
        return res.status(400).json({
          success: false,
          message: "Query must be at least 2 characters long",
        });
      }

      const categories = await CategoryService.searchCategories(query, limit);

      return res.status(200).json({
        success: true,
        categories,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAllCategories(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 200;
    const filter = req.query.filter
      ? JSON.parse(req.query.filter as string)
      : {};

    const skip = (page - 1) * limit;

    const [categories, total] = await Promise.all([
      CategoryModel.find(filter).populate('parent', 'name slug').skip(skip).limit(limit),
      CategoryModel.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      message: "Categories fetched successfully",
      categories,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    next(error);
  }
}

  static async getCombinedAttributes(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { category } = req.query;
      const subCategory = req.query.subCategory as string | undefined;

      if (!category) {
        return res.status(400).json({
          success: false,
          message: "Category ID is required",
        });
      }

      const result = await CategoryService.getCombinedAttributes(
        category as string,
        subCategory
      );

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCategoryRequirements(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { categoryName, subCategoryName } = req.query;

      if (!categoryName) {
        return res.status(400).json({
          success: false,
          message: "Category name is required",
        });
      }

      const category = await CategoryModel.findOne({ name: categoryName });
      let subCategory = null;

      if (subCategoryName) {
        subCategory = await CategoryModel.findOne({ name: subCategoryName });
      }

      const requirements = {
        dimensionsRequired: subCategory?.productDimensionsRequired ?? category?.productDimensionsRequired ?? false,
        weightRequired: subCategory?.productWeightRequired ?? category?.productWeightRequired ?? false
      };

      res.json({
        success: true,
        requirements
      });
    } catch (error) {
      next(error);
    }
  }
}
