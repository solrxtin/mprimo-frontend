import { Router, Request, Response, NextFunction } from "express"
import passport from "passport"

import { login, logout, refreshAccessToken, signup } from "../controllers/auth.controller"
import asyncHandler from "express-async-handler"
import { verifyToken } from "../middlewares/verify-token.middleware"
import { generateTokensAndSetCookie } from "../utils/generate-token.util"

const router = Router()
router.post('/signup', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await signup(req, res);
    } catch (error) {
        next(error);
    }
});

router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await login(req, res);
    } catch (error) {
        next(error);
    }
});



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

router.post('/refresh', 
    //middleware to verify token
    (req: Request, res: Response, next: NextFunction) => {
        verifyToken(req, res, next);
    },
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
  
// router.get('/google/callback',
//     passport.authenticate('google', { failureRedirect: '/login' }),
//     async (req: Request, res: Response) => {
//       try {
//         if (!req.user?._id) {
//             return res.redirect('/login');
//           }
//           await generateTokensAndSetCookie(res, req.user._id);
//         res.redirect('/dashboard');
//       } catch(err) {
//         console.error(err)
//         res.redirect('/login')
//       }
//     }
// );
  

export default router