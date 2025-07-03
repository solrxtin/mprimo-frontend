import { Request, Response, NextFunction } from 'express';
import { ProductImportService } from '../services/product-import.service';
import Vendor from '../models/vendor.model';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

export class ProductImportController {
  static async importFromCSV(req: Request, res: Response, next: NextFunction) {
    try {
      const vendor = await Vendor.findOne({ userId: req.userId });
      if (!vendor) {
        return res.status(404).json({
          success: false,
          message: 'Vendor not found'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'CSV file is required'
        });
      }

      const result = await ProductImportService.importFromCSV(
        req.file.buffer,
        vendor._id.toString()
      );

      res.json({
        success: true,
        message: `Import completed: ${result.summary.successful}/${result.summary.total} products imported`,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  static async importFromJSON(req: Request, res: Response, next: NextFunction) {
    try {
      const vendor = await Vendor.findOne({ userId: req.userId });
      if (!vendor) {
        return res.status(404).json({
          success: false,
          message: 'Vendor not found'
        });
      }

      let products;
      if (req.file) {
        const jsonData = JSON.parse(req.file.buffer.toString());
        products = jsonData.products || jsonData;
      } else if (req.body.products) {
        products = JSON.parse(req.body.products);
      } else {
        return res.status(400).json({
          success: false,
          message: 'Products data is required'
        });
      }

      const result = await ProductImportService.importFromJSON(
        products,
        vendor._id.toString()
      );

      res.json({
        success: true,
        message: `Import completed: ${result.summary.successful}/${result.summary.total} products imported`,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  static async importFromShopify(req: Request, res: Response, next: NextFunction) {
    try {
      const vendor = await Vendor.findOne({ userId: req.userId });
      if (!vendor) {
        return res.status(404).json({
          success: false,
          message: 'Vendor not found'
        });
      }

      const { apiKey, storeUrl } = req.body;
      if (!apiKey || !storeUrl) {
        return res.status(400).json({
          success: false,
          message: 'Shopify API key and store URL are required'
        });
      }

      const result = await ProductImportService.importFromShopify(
        apiKey,
        storeUrl,
        vendor._id.toString()
      );

      res.json({
        success: true,
        message: `Import completed: ${result.summary.successful}/${result.summary.total} products imported`,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  static async importFromWooCommerce(req: Request, res: Response, next: NextFunction) {
    try {
      const vendor = await Vendor.findOne({ userId: req.userId });
      if (!vendor) {
        return res.status(404).json({
          success: false,
          message: 'Vendor not found'
        });
      }

      const { apiKey, apiSecret, storeUrl } = req.body;
      if (!apiKey || !apiSecret || !storeUrl) {
        return res.status(400).json({
          success: false,
          message: 'WooCommerce API credentials and store URL are required'
        });
      }

      const result = await ProductImportService.importFromWooCommerce(
        apiKey,
        apiSecret,
        storeUrl,
        vendor._id.toString()
      );

      res.json({
        success: true,
        message: `Import completed: ${result.summary.successful}/${result.summary.total} products imported`,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }
}

export { upload };