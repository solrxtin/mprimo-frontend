import express, { Request, Response, NextFunction } from "express";
import { verifyToken } from "../middlewares/verify-token.middleware";


import { cartController } from "../controllers/cart.controller";

const cartrouter = express.Router();


cartrouter.get(
  "/get-cart",
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await cartController.getCart(req, res);
    } catch (error) {
      next(error);
    }
  }
);


cartrouter.post(
  "/add-to-cart",
    (req: Request, res: Response, next: NextFunction) => {
        verifyToken(req, res, next);
    },
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await cartController.addToCart(req, res);
        } catch (error) {
            next(error);
        }
    }
);

cartrouter.put(
    "/update-cart/:id",
    (req: Request, res: Response, next: NextFunction) => {
        verifyToken(req, res, next);
    },
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await cartController.updateCartItem(req, res);
        } catch (error) {
            next(error);
        }
    }
);
cartrouter.delete(
    "/clear",
    (req: Request, res: Response, next: NextFunction) => {
        verifyToken(req, res, next);
    },
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await cartController.clearCart(req, res);
        } catch (error) {
            next(error);
        }
    }
);

cartrouter.get(
  "/cart-summary",
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await cartController.getCartSummary(req, res);
    } catch (error) {
      next(error);
    }
  }
);

////======Wish list Routes========
cartrouter.get(
    "/wishlist",
    (req: Request, res: Response, next: NextFunction) => {
        verifyToken(req, res, next);
    },
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await cartController.getWishlist(req, res);
        } catch (error) {
            next(error);
        }
    }
);
cartrouter.post(
    "/add-to-wishlist",
    (req: Request, res: Response, next: NextFunction) => {
        verifyToken(req, res, next);
    },
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await cartController.addToWishlist(req, res);
        } catch (error) {
            next(error);
        }
    }
);
cartrouter.delete(
    "/wishlist/:id",
    (req: Request, res: Response, next: NextFunction) => {
        verifyToken(req, res, next);
    },
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await cartController.removeFromWishlist(req, res);
        } catch (error) {
            next(error);
        }
    }
);

export default cartrouter;


