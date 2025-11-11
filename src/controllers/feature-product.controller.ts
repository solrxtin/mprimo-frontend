import { Request, Response } from "express";
import Product from "../models/product.model";
import AuditLogService from "../services/audit-log.service";

export class FeatureProductController {
  static async featureProduct(req: Request, res: Response) {
    try {
      const { productId } = req.params;
      const { 
        featuredCategory, 
        featuredExpiry, 
      } = req.body;

      if (!featuredCategory || !featuredExpiry) {
        return res.status(400).json({
          success: false,
          message: "featuredCategory and featuredExpiry are required"
        });
      }

      const expiryDate = new Date(featuredExpiry);
      if (expiryDate <= new Date()) {
        return res.status(400).json({
          success: false,
          message: "Featured expiry must be in the future"
        });
      }

      const product = await Product.findByIdAndUpdate(
        productId,
        {
          isFeatured: true,
          featuredCategory,
          featuredExpiry: expiryDate,
        },
        { new: true }
      );

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found"
        });
      }

      await AuditLogService.log(
        "PRODUCT_FEATURED",
        "admin",
        "info",
        {
          productId,
          productName: product.name,
          featuredCategory,
          featuredExpiry: expiryDate,
          adminId: req.userId
        },
        req,
        productId
      );

      res.json({
        success: true,
        message: "Product featured successfully",
        data: product
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error featuring product"
      });
    }
  }

  static async unfeatureProduct(req: Request, res: Response) {
    try {
      const { productId } = req.params;

      const product = await Product.findByIdAndUpdate(
        productId,
        {
          isFeatured: false,
          featuredCategory: undefined,
          featuredExpiry: undefined,
        },
        { new: true }
      );

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found"
        });
      }

      await AuditLogService.log(
        "PRODUCT_UNFEATURED",
        "admin",
        "info",
        {
          productId,
          productName: product.name,
          adminId: req.userId
        },
        req,
        productId
      );

      res.json({
        success: true,
        message: "Product unfeatured successfully",
        data: product
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error unfeaturing product"
      });
    }
  }
}