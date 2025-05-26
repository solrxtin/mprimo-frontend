// src/controllers/product.controller.ts
import { Request, Response, NextFunction } from "express";
import { ProductService } from "../services/product.service";

export class ProductController {
  static async createProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const productData = {
        ...req.body,
        vendorId: req.userId!,
      };

      const product = await ProductService.createProduct(productData);

      res.status(201).json({ product });
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
      next(error);
    }
  }

  static async updateProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await ProductService.updateProduct(
        req.params.id,
        req.userId!.toString(),
        req.body
      );
      res.json({ product });
    } catch (error) {
      next(error);
    }
  }

  static async deleteProduct(req: Request, res: Response, next: NextFunction) {
    try {
      await ProductService.deleteProduct(req.params.id, req.userId!.toString());
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

      const product = await ProductService.updateInventory(
        req.params.id,
        req.userId!.toString(),
        Number(quantity),
        operation as "add" | "subtract"
      );

      res.json({ product });
    } catch (error) {
      next(error);
    }
  }

  static async addVariant(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await ProductService.addVariant(
        req.params.id,
        req.userId!.toString(),
        req.body
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
      next(error);
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