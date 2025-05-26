// src/controllers/category.controller.ts
import { Request, Response, NextFunction } from 'express';
import { CategoryService } from '../services/category.service';


export class CategoryController {
  static async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
    //   await validateCategory(req.body);
    console.log(req.body);
      const category = await CategoryService.createCategory(
        req.body,
        req.userId.toString()
      );
      res.status(201).json({ category });
    } catch (error) {
      next(error);
    }
  }

  static async updateCategory(req: Request, res: Response, next: NextFunction) {
    try {
    //   await validateCategory(req.body, true);
      const category = await CategoryService.updateCategory(
        req.params.id,
        req.body,
        req.userId.toString()
      );
      res.json({ category });
    } catch (error) {
      next(error);
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
      const category = await CategoryService.getCategoryBySlug(req.params.slug);
      res.json({ category });
    } catch (error) {
      next(error);
    }
  }

  static async getCategoryTree(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await CategoryService.getCategoryTree(req.query.parentId as string);
      res.json({ categories });
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

  static async removeAttribute(req: Request, res: Response, next: NextFunction) {
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

  static async searchCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await CategoryService.searchCategories(
        req.query.q as string,
        Number(req.query.limit)
      );
      res.json({ categories });
    } catch (error) {
      next(error);
    }
  }
  static async getCategories (req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await CategoryService.getCategories(
        Number(req.query.page) || 1,
        Number(req.query.limit) || 10,
      );
      res.json({ categories });
    } catch (error) {
      next(error);
    }
  }
}
