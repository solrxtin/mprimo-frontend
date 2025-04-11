// src/routes/order.routes.ts
import express, { Request, Response, NextFunction } from "express";
import { verifyToken } from "../middlewares/verify-token.middleware";
import { authorizeRole } from "../middlewares/authorize-role.middleware";
import { orderController } from "../controllers/order-wishlist.controller";

const orderrouter = express.Router();

orderrouter.get(
  "/get-orders",
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  orderController.getOrders
);

orderrouter.get(
  "/:id",
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await orderController.getOrderDetails(req, res);
    } catch (error) {
      next(error);
    }
  }
);


orderrouter.post(
  "/craete-orders",
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await orderController.createOrder(req, res);
    } catch (error) {
      next(error);
    }
  }
);



export default orderrouter;
