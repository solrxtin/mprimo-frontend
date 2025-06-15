import { Router, Request, Response, NextFunction } from "express";
import { verifyToken } from "../middlewares/verify-token.middleware";
import { authorizeRole } from "../middlewares/authorize-role.middleware";
// import * as adminController from "../controllers/admin.controller";
import * as countryController from "../controllers/country.controller";

const router = Router();

// Admin dashboard
// router.get(
//   "/dashboard",
//   (req: Request, res: Response, next: NextFunction) => {
//     verifyToken(req, res, next);
//   },
//   (req: Request, res: Response, next: NextFunction) => {
//     authorizeRole(["admin"])(req, res, next);
//   },
//   async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       await adminController.getDashboard(req, res);
//     } catch (error) {
//       next(error);
//     }
//   }
// );

// Get all countries
router.get(
  "/countries",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await countryController.getCountries(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// Get country by ID
router.get(
  "/countries/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await countryController.getCountryById(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// Create country
router.post(
  "/countries",
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  (req: Request, res: Response, next: NextFunction) => {
    authorizeRole(["admin"])(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await countryController.createCountry(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// Update country
router.put(
  "/countries/:id",
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  (req: Request, res: Response, next: NextFunction) => {
    authorizeRole(["admin"])(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await countryController.updateCountry(req, res);
    } catch (error) {
      next(error);
    }
  }
);

export default router;