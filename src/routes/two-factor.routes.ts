// src/routes/twoFactor.routes.ts
import express, {Request, Response, NextFunction} from 'express';
import { TwoFactorController } from '../controllers/two-factor.controller';
import { verifyToken } from '../middlewares/verify-token.middleware';

const router = express.Router();

router.post('/setup', 
    //middleware to verify token
    (req: Request, res: Response, next: NextFunction) => {
        verifyToken(req, res, next);
    },
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await TwoFactorController.setup(req, res);
        } catch (error) {
            next(error);
        }
    }
)

router.post('/enable', 
    //middleware to verify token
    (req: Request, res: Response, next: NextFunction) => {
        verifyToken(req, res, next);
    },
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await TwoFactorController.enable(req, res);
        } catch (error) {
            next(error);
        }
    }
)

router.post('/disable', 
    //middleware to verify token
    (req: Request, res: Response, next: NextFunction) => {
        verifyToken(req, res, next);
    },
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await TwoFactorController.disable(req, res);
        } catch (error) {
            next(error);
        }
    }
)


router.post('/verify', 
    (req: Request, res: Response, next: NextFunction) => {
        verifyToken(req, res, next);
    },
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await TwoFactorController.verify(req, res);
        } catch (error) {
            next(error);
        }
    }
)

router.post('/verify-backup', 
    (req: Request, res: Response, next: NextFunction) => {
        verifyToken(req, res, next);
    },
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await TwoFactorController.verifyBackup(req, res);
        } catch (error) {
            next(error);
        }
    }
)

export default router;
