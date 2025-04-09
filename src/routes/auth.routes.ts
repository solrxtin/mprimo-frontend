import { Router, Request, Response, NextFunction } from "express"
import passport from "passport"

import { logout, signup, login, refreshAccessToken, requestPasswordChange, changePassword } from "../controllers/auth.controller"
import { verifyToken } from "../middlewares/verify-token.middleware"
import { generateTokensAndSetCookie } from "../utils/generate-token.util"
import { rateLimitMiddleware } from '../middlewares/rate-limit.middleware';
import { User } from "../types/user.type"


const router = Router()

// 3 Registerations per IP per day
router.post('/register',
    rateLimitMiddleware.register,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await signup(req, res);
        } catch (error) {
            next(error);
        }
    }
);

// 5 login attempts per hour
router.post('/login',
    rateLimitMiddleware.auth,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await login(req, res);
        } catch (error) {
            next(error);
        }
    }
);

router.post('/logout', 
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
)

// Password reset request - limited to 3 attempts per hour
router.post('/forgot-password',
    rateLimitMiddleware.passwordReset,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await requestPasswordChange(req, res);
        } catch (error) {
            next(error);
        }
    }
);
  
// Password reset confirmation - limited to 3 attempts per hour
router.post('/reset-password',
    rateLimitMiddleware.passwordReset,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await changePassword(req, res);
        } catch (error) {
            next(error);
        }
    }
);

router.post('/refresh', 
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
)

// Google Routes
router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);
  
router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    async (req: Request, res: Response) => {
      try {
        const user = req.user as User;

        if (!user._id) {
            return res.redirect('/login');
          }
          await generateTokensAndSetCookie(res, user._id);
        res.redirect('/dashboard');
      } catch(err) {
        console.error(err)
        res.redirect('/login')
      }
    }
);
  

export default router