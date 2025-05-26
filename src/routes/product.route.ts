// src/routes/product.routes.ts
import express, {Request, Response, NextFunction} from 'express';
import { ProductController } from '../controllers/product.controller';
import { verifyToken } from '../middlewares/verify-token.middleware';
import { authorizeVendor } from '../middlewares/authorize-role.middleware';


const router = express.Router();

// Public routes
router.get('/search', ProductController.searchProducts);
router.get('/', ProductController.getProducts);
router.get('/:id', ProductController.getProduct);

router.post('/', 
    //middleware to verify token
    (req: Request, res: Response, next: NextFunction) => {
        verifyToken(req, res, next);
    },
    (req: Request, res: Response, next: NextFunction) => {
        authorizeVendor();
    },
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await ProductController.createProduct(req, res, next);
        } catch (error) {
            next(error);
        }
    }
)
router.put('/:id', 
    //middleware to verify token
    (req: Request, res: Response, next: NextFunction) => {
        verifyToken(req, res, next);
    },
    (req: Request, res: Response, next: NextFunction) => {
        authorizeVendor();
    },
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await ProductController.updateProduct(req, res, next);
        } catch (error) {
            next(error);
        }
    }
)

router.delete('/:id', 
    //middleware to verify token
    (req: Request, res: Response, next: NextFunction) => {
        verifyToken(req, res, next);
    },
    (req: Request, res: Response, next: NextFunction) => {
        authorizeVendor();
    },
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await ProductController.deleteProduct(req, res, next);
        } catch (error) {
            next(error);
        }
    }
)

router.post('/:id/variants', 
    //middleware to verify token
    (req: Request, res: Response, next: NextFunction) => {
        verifyToken(req, res, next);
    },
    (req: Request, res: Response, next: NextFunction) => {
        authorizeVendor();
    },
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await ProductController.addVariant(req, res, next);
        } catch (error) {
            next(error);
        }
    }
)
router.patch('/:id/inventory', 
    //middleware to verify token
    (req: Request, res: Response, next: NextFunction) => {
        verifyToken(req, res, next);
    },
    (req: Request, res: Response, next: NextFunction) => {
        authorizeVendor();
    },
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await ProductController.updateInventory(req, res, next);
        } catch (error) {
            next(error);
        }
    }
)

router.post('/', ProductController.createProduct);
router.put('/:id', ProductController.updateProduct);
router.delete('/:id', ProductController.deleteProduct);
router.patch('/:id/inventory', ProductController.updateInventory);
router.post('/:id/variants', ProductController.addVariant);
router.post('/:id/reviews', ProductController.addReview);

export default router;
