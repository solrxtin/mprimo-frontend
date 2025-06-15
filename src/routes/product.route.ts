// src/routes/product.route.ts
import { Router, Request, Response, NextFunction } from "express";
import { ProductController } from "../controllers/product.controller";
import { verifyToken } from "../middlewares/verify-token.middleware";
import { authorizeRole } from "../middlewares/authorize-role.middleware";
import { ProductService } from "../services/product.service";
import { uploadImage, uploadImageToCloudinary } from '../config/multer.config';

const router = Router();

// ==================== PUBLIC ROUTES ====================

// Upload route
router.post('/upload', uploadImage, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: "No image provided"
      });
      return;
    }
    
    const result = await uploadImageToCloudinary(req.file.path);
    
    res.status(200).json({
      success: true,
      message: "Image uploaded successfully!",
      imageUrl: result.url
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// Get all products
router.get(
  "/",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await ProductController.getProducts(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

// Search products
router.get(
  "/search",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await ProductController.searchProducts(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

// Get products by category
router.get(
  "/category/:categoryId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await ProductController.getProductsByCategory(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

// Get top products
router.get(
  "/top",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await ProductController.getTopProducts(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

// Get category specifications
router.get(
  "/categories/:categoryId/specifications",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const specifications = await ProductService.getRequiredSpecifications(
        req.params.categoryId
      );
      res.json({ specifications });
    } catch (error) {
      next(error);
    }
  }
);



// Get related products
router.get(
  "/:id/related",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await ProductController.getRelatedProducts(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

// Get product reviews
router.get(
  "/:id/reviews",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await ProductController.getReviews(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

// Track product events (view, click, etc.)
router.post(
  "/:id/track/:eventType",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await ProductController.trackProductEvent(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

// ==================== AUTHENTICATED ROUTES ====================

// Add review to product
router.post(
  "/:id/reviews",
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await ProductController.addReview(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

// Process checkout
router.post(
  "/checkout",
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await ProductController.checkout(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

// ==================== PRODUCT DRAFTS ROUTES ====================

// Save draft
router.post(
  "/drafts",
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  (req: Request, res: Response, next: NextFunction) => {
    authorizeRole(["business", "admin"])(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await ProductController.saveDraft(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

// Get all drafts
router.get(
  "/drafts",
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  (req: Request, res: Response, next: NextFunction) => {
    authorizeRole(["business", "admin"])(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await ProductController.getDrafts(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

// Update draft
router.patch(
  "/drafts/:id",
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  (req: Request, res: Response, next: NextFunction) => {
    authorizeRole(["business", "admin"])(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await ProductController.updateDraft(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

// Delete draft
router.delete(
  "/drafts/:id",
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  (req: Request, res: Response, next: NextFunction) => {
    authorizeRole(["business", "admin"])(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await ProductController.deleteDraft(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

// ==================== VENDOR/ADMIN ROUTES ====================

// Create product
router.post(
  "/",
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  (req: Request, res: Response, next: NextFunction) => {
    authorizeRole(["business", "admin"])(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await ProductController.createProduct(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

// Update product
router.put(
  "/:id",
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  (req: Request, res: Response, next: NextFunction) => {
    authorizeRole(["business", "admin"])(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await ProductController.updateProduct(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/vendor/:vendorId",
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  (req: Request, res: Response, next: NextFunction) => {
    authorizeRole(["business", "admin"])(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await ProductController.getVendorProducts(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

// Get single product
router.get(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await ProductController.getProduct(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

// Delete product
router.delete(
  "/:id",
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  (req: Request, res: Response, next: NextFunction) => {
    authorizeRole(["business", "admin"])(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await ProductController.deleteProduct(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

// Update inventory
router.patch(
  "/:id/inventory",
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  (req: Request, res: Response, next: NextFunction) => {
    authorizeRole(["business", "admin"])(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await ProductController.updateInventory(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

// Add variant
router.post(
  "/:id/variants",
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  (req: Request, res: Response, next: NextFunction) => {
    authorizeRole(["business", "admin"])(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await ProductController.addVariant(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

export default router;