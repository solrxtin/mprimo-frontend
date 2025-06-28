import { Router, Request, Response, NextFunction } from "express";
import { verifyToken } from "../middlewares/verify-token.middleware";
// import { authorizeRole } from "../middlewares/authorize-role.middleware";
import {
  createCryptoWallet,
  getBalance,
  getUserWallet,
} from "../controllers/payment.controller";

const router = Router();

router.post(
  "/crypto/create-wallet",
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    await createCryptoWallet(req, res);
  }
);

router.get(
  "/crypto/get-balance",
  async (req: Request, res: Response, next: NextFunction) => {
    await getBalance(req, res);
  }
);

router.get(
  "/crypto/get-wallet",
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    await getUserWallet(req, res);
  }
);

export default router;
