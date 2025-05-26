// src/routes/user.routes.ts
import express, { Request, Response, NextFunction } from 'express';
import { adminController} from '../controllers/user.controller';
import { verifyToken } from '../middlewares/verify-token.middleware';
import { authorizeRole } from '../middlewares/authorize-role.middleware';

const userRouter = express.Router();

// User profile routes (authenticated users)
userRouter.get('/profile',
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await adminController.getProfile(req, res);
    } catch (error) {
      next(error);
    }
  }
);

userRouter.put('/profile',
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await adminController.updateProfile(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// Address management routes
userRouter.post('/addresses',
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await adminController.addAddress(req, res);
    } catch (error) {
      next(error);
    }
  }
);

userRouter.get('/addresses',
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await adminController.getAddresses(req, res);
    } catch (error) {
      next(error);
    }
  }
);

userRouter.put('/addresses/:addressId',
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await adminController.updateAddress(req, res);
    } catch (error) {
      next(error);
    }
  }
);

userRouter.delete('/addresses/:addressId',
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await adminController.deleteAddress(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// Preferences route
userRouter.put('/preferences',
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await adminController.updatePreferences(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// Admin routes
userRouter.get('/listUsers',
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  (req: Request, res: Response, next: NextFunction) => {
    authorizeRole({ roles: ['admin'], req, res, next });
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await adminController.listUsers(req, res);
    } catch (error) {
      next(error);
    }
  }
);

userRouter.get('/admin/:id',
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  (req: Request, res: Response, next: NextFunction) => {
    authorizeRole({ roles: ['admin'], req, res, next });
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await adminController.getUser(req, res);
    } catch (error) {
      next(error);
    }
  }
);

userRouter.put('/:id/status',
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  (req: Request, res: Response, next: NextFunction) => {
    authorizeRole({ roles: ['admin'], req, res, next });
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await adminController.updateStatus(req, res);
    } catch (error) {
      next(error);
    }
  }
);

userRouter.put('/admin/:id',
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  (req: Request, res: Response, next: NextFunction) => {
    authorizeRole({ roles: ['admin'], req, res, next });
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await adminController.updateUser(req, res);
    } catch (error) {
      next(error);
    }
  }
);

export default userRouter;