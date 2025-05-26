import express, { Request, Response, NextFunction } from "express";
import { verifyToken } from "../middlewares/verify-token.middleware";


import { CategoryController } from "../controllers/category.controller";
const categoryrouter = express.Router();


categoryrouter.get(
  "/get-categories",
  (req: Request, res: Response, next: NextFunction) => {
      verifyToken(req, res, next);
    },
    CategoryController.getCategories
);

categoryrouter.get(
    "/search-categories",
    (req: Request, res: Response, next: NextFunction) => {
      verifyToken(req, res, next);
    },
    CategoryController.searchCategories // Corrected to use the appropriate controller method
  );

  categoryrouter.post(
    "/create-category", 
    (req: Request, res: Response, next: NextFunction) => {
        verifyToken(req, res, next);
      },
      CategoryController.createCategory 
  )

  categoryrouter.put(
    "/update-category/:id",
    (req: Request, res: Response, next: NextFunction) => {
        verifyToken(req, res, next);
      },
      CategoryController.updateCategory
  )
  categoryrouter.delete(
    "/:id",
    (req: Request, res: Response, next: NextFunction) => {
        verifyToken(req, res, next);
      },
      CategoryController.updateCategory
  )

  categoryrouter.get(
    "/search-categories-slug",
    (req: Request, res: Response, next: NextFunction) => {
      verifyToken(req, res, next);
    },
    CategoryController.getCategoryBySlug // Corrected to use the appropriate controller method
  );

  categoryrouter.get(
    "/search-categories-tree",
    (req: Request, res: Response, next: NextFunction) => {
      verifyToken(req, res, next);
    },
    CategoryController.getCategoryTree // Corrected to use the appropriate controller method
  );

  categoryrouter.post(
    "/add-attribute",
    (req: Request, res: Response, next: NextFunction) => {
      verifyToken(req, res, next);
    },
    CategoryController.addAttribute // Corrected to use the appropriate controller method
  );


  categoryrouter.delete(
    "/remove-attribute/:id",
    (req: Request, res: Response, next: NextFunction) => {
      verifyToken(req, res, next);
    },
    CategoryController.removeAttribute // Corrected to use the appropriate controller method
  );



export default categoryrouter
