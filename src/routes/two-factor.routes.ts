// src/routes/twoFactor.routes.ts
import express, {Request, Response, NextFunction} from 'express';
import { TwoFactorController } from '../controllers/two-factor.controller';
import { verifyToken } from '../middlewares/verify-token.middleware';

const twofactorrouter = express.Router();

twofactorrouter.post('/setup', 
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

twofactorrouter.post('/enable', 
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

twofactorrouter.post('/disable', 
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

twofactorrouter.post('/setup', 
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

twofactorrouter.post('/verify', 
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await TwoFactorController.verify(req, res);
        } catch (error) {
            next(error);
        }
    }
)

export default twofactorrouter;
