import { Router } from 'express';
import { ProductImportController } from '../controllers/product-import.controller';
import { verifyToken } from '../middlewares/verify-token.middleware';

const router = Router();

// All import routes require authentication
router.use(verifyToken);

// CSV Import
router.post('/csv', 
  ProductImportController.uploadMiddleware,
  ProductImportController.importCSV
);

// JSON Import
router.post('/json', ProductImportController.importJSON);

// External Platform Imports
router.post('/shopify', ProductImportController.importFromShopify);
router.post('/woocommerce', ProductImportController.importFromWooCommerce);

// Get import template
router.get('/template', ProductImportController.getImportTemplate);

export default router;