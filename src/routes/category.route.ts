import express, { Request, Response, NextFunction } from "express";
import { verifyToken } from "../middlewares/verify-token.middleware";


import { CategoryController } from "../controllers/category.controller";
const cartrouter = express.Router();