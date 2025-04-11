// src/routes/product.routes.ts
import express, {Request, Response, NextFunction} from 'express';
import { ProductController } from '../controllers/product.controller';
import { verifyToken } from '../middlewares/verify-token.middleware';
import { authorizeRole } from '../middlewares/authorize-role.middleware';


const productrouter = express.Router();

// Public routes
productrouter.get('/search', ProductController.searchProducts);
productrouter.get('/get-products', ProductController.getProducts);
productrouter.get('/get-products/:id', ProductController.getProduct);

productrouter.post('/craete-product', 
    //middleware to verify token
    (req: Request, res: Response, next: NextFunction) => {
        verifyToken(req, res, next);
    },
    (req: Request, res: Response, next: NextFunction) => {
        authorizeRole(["vendor"]);
    },
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await ProductController.createProduct(req, res, next);
        } catch (error) {
            next(error);
        }
    }
)
productrouter.put('/update-product/:id', 
    //middleware to verify token
    (req: Request, res: Response, next: NextFunction) => {
        verifyToken(req, res, next);
    },
    (req: Request, res: Response, next: NextFunction) => {
        authorizeRole(["vendor"]);
    },
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await ProductController.updateProduct(req, res, next);
        } catch (error) {
            next(error);
        }
    }
)

productrouter.delete('/delete-product/:id', 
    //middleware to verify token
    (req: Request, res: Response, next: NextFunction) => {
        verifyToken(req, res, next);
    },
    (req: Request, res: Response, next: NextFunction) => {
        authorizeRole(["vendor"]);
    },
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await ProductController.deleteProduct(req, res, next);
        } catch (error) {
            next(error);
        }
    }
)

productrouter.post('/:id/variants', 
    //middleware to verify token
    (req: Request, res: Response, next: NextFunction) => {
        verifyToken(req, res, next);
    },
    (req: Request, res: Response, next: NextFunction) => {
        authorizeRole(["vendor"]);
    },
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await ProductController.addVariant(req, res, next);
        } catch (error) {
            next(error);
        }
    }
)
productrouter.patch('/:id/inventory', 
    //middleware to verify token
    (req: Request, res: Response, next: NextFunction) => {
        verifyToken(req, res, next);
    },
    (req: Request, res: Response, next: NextFunction) => {
        authorizeRole(["vendor"]);
    },
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await ProductController.updateInventory(req, res, next);
        } catch (error) {
            next(error);
        }
    }
)

export default productrouter;
