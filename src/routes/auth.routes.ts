import { Router, Request, Response, NextFunction } from "express";
import passport from "../config/passport.config";

import {
  logout,
  signup,
  login,
  refreshAccessToken,
  requestPasswordChange,
  changePassword,
  signupVendor,
  verifyController,
  resendVerificationController,
  verifyPasswordResetEmail,
  resendPasswordChangeEmail,
} from "../controllers/auth.controller";
import { verifyToken } from "../middlewares/verify-token.middleware";
import { generateTokensAndSetCookie } from "../utils/generate-token.util";
import { strictRateLimit, moderateRateLimit } from "../middlewares/rate-limit.middleware";
import User from "../models/user.model";
import { IUser } from "../types/user.type";
import { setPreferencesMiddleware } from "../middlewares/country-prefrences.middleware";


const router = Router();

// 3 Registerations per IP per day
router.post(
  "/register",
  strictRateLimit,
  setPreferencesMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await signup(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// 5 attempts per hour per IP
router.post(
  "/register-vendor",
  // rateLimitMiddleware.auth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await signupVendor(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// 5 attempts per hour per IP
router.post(
  "/verify",
  // rateLimitMiddleware.auth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await verifyController(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// 5 attempts
router.post(
  "/resend-verification",
  // rateLimitMiddleware.auth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await resendVerificationController(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// 5 login attempts per hour
router.post(
  "/login",
  // rateLimitMiddleware.auth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await login(req, res);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/logout",
  //middleware to verify token
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await logout(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// Password reset request - limited to 3 attempts per hour
router.post(
  "/forgot-password",
  strictRateLimit,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await requestPasswordChange(req, res);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/verify-password-reset-token",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await verifyPasswordResetEmail(req, res);
    } catch (error) {
      next(error);
    }
  }
);
// Can't make more than 3 requests per hour
router.post(
  "/resend-password-reset-token",
  strictRateLimit,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await resendPasswordChangeEmail(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// Password reset confirmation - limited to 3 attempts per hour
router.post(
  "/reset-password",
  strictRateLimit,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await changePassword(req, res);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/refresh",
  //middleware to verify token
  // (req: Request, res: Response, next: NextFunction) => {
  //     verifyToken(req, res, next);
  // },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await refreshAccessToken(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// Google Routes
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "http://localhost:3000/login" }),
  async (req: Request, res: Response) => {
    try {
      const user = req.user as IUser;

      if (!user._id) {
        return res.redirect("http://localhost:3000/login");
      }
      const loggedInUser = await User.findById(user._id);

      if (loggedInUser) {
        loggedInUser.preferences.language = req.preferences?.language;
        loggedInUser.preferences.currency = req.preferences?.currency;
        loggedInUser.activity.lastLogin = new Date()
        loggedInUser.save();
      }

      await generateTokensAndSetCookie(res, user._id);

      res.redirect("http://localhost:3000");
    } catch (err) {
      console.error(err);
      res.redirect("http://localhost:3000/login");
    }
  }
);

// Apple Sign In with identity token
// router.post("/apple", appleLogin);

// router.get("/auth/apple", passport.authenticate("apple"));

// router.get(
//   "/auth/apple/callback",
//   passport.authenticate("apple", { failureRedirect: "/login" }),
//   (req, res) => {
//     res.redirect("/");
//   }
// );


export default router;
