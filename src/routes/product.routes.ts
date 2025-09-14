// src/routes/product.route.ts
import { Router, Request, Response, NextFunction } from "express";
import { acceptCounterOffer, acceptOffer, makeCounterOffer, placeProxyBid, ProductController, rejectCounterOffer, rejectOffer } from "../controllers/product.controller";
import { verifyToken } from "../middlewares/verify-token.middleware";
import { authorizeRole } from "../middlewares/authorize-role.middleware";
import { ProductService } from "../services/product.service";
import { uploadImage, uploadImageToCloudinary } from "../config/multer.config";
import { standardRateLimit } from "../middlewares/enhanced-rate-limit.middleware";

const router = Router();

// ==================== PUBLIC ROUTES ====================

// Upload route
router.post(
  "/upload",
  uploadImage,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: "No image provided",
        });
        return;
      }

      const result = await uploadImageToCloudinary(req.file.path);

      res.status(200).json({
        success: true,
        message: "Image uploaded successfully!",
        imageUrl: result.url,
      });
    } catch (error) {
      console.error(error);
      next(error);
    }
  }
);

// Get all products
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await ProductController.getProducts(req, res, next);
  } catch (error) {
    next(error);
  }
});

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

// Get search suggestions
router.get(
  "/search/suggestions",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await ProductController.getSearchSuggestions(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

// Advanced search
router.get(
  "/search/advanced",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await ProductController.advancedSearch(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

// Get products by categoryId
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
  "/topProducts",
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
router.get(
  "/:id/track",
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

router.get(
  "/:productId/performance",
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  (req: Request, res: Response, next: NextFunction) => {
    authorizeRole(["business", "admin"])(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await ProductController.getProductPerformance(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

// Process checkout
// router.post(
//   "/checkout",
//   (req: Request, res: Response, next: NextFunction) => {
//     verifyToken(req, res, next);
//   },
//   async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       await ProductController.checkout(req, res, next);
//     } catch (error) {
//       next(error);
//     }
//   }
// );

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
  standardRateLimit,
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
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await ProductController.getProduct(req, res, next);
  } catch (error) {
    next(error);
  }
});

router.get(
  "/slug/:slug",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await ProductController.getProductBySlug(req, res, next);
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

// Bulk update variants
router.patch(
  "/:id/variants/bulk",
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  (req: Request, res: Response, next: NextFunction) => {
    authorizeRole(["business", "admin"])(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await ProductController.bulkUpdateVariants(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

// Get inventory history
router.get(
  "/:id/inventory/history",
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  (req: Request, res: Response, next: NextFunction) => {
    authorizeRole(["business", "admin"])(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await ProductController.getInventoryHistory(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

// Get reorder alerts
router.get(
  "/inventory/reorder-alerts",
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  (req: Request, res: Response, next: NextFunction) => {
    authorizeRole(["business", "admin"])(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await ProductController.getReorderAlerts(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

// Cart Routes
router.post(
  "/cart",
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await ProductController.addToCart(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/cart/merge",
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await ProductController.mergeCart(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  "/cart/:productId",
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await ProductController.addToCart(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/cart",
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await ProductController.addToCart(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  "/cart",
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await ProductController.addToCart(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

// Wishlist routes
router.post(
  "/wishlist/:productId",
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await ProductController.addToCart(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  "/wishlist/:productId",
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await ProductController.addToCart(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/wishlist",
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await ProductController.addToCart(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  "/wishlist",
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await ProductController.addToCart(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

// Offer routes
router.post(
  "/offer/:productId",
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await ProductController.makeOffer(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/offer/:productId/counter",
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await makeCounterOffer(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/offer/:vendorId/accept",
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await acceptOffer(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/offer/:vendorId/accept-counter-offer",
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await acceptCounterOffer(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/offer/:vendorId/reject",
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await rejectOffer(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/offer/:vendorId/reject-counter-offer",
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await rejectCounterOffer(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

// Bidding route
router.post(
  "/bid/:productId",
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await placeProxyBid(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);


export default router;
