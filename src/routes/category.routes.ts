// src/routes/category.routes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { CategoryController } from '../controllers/category.controller';
import { verifyToken } from '../middlewares/verify-token.middleware';
import { authorizeRole } from '../middlewares/authorize-role.middleware';

const router = Router();

// Public routes
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await CategoryController.getAllCategories(req, res, next);
  } catch (error) {
    next(error);
  }
});

router.get('/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await CategoryController.searchCategories(req, res, next);
  } catch (error) {
    next(error);
  }
});

router.get('/attributes', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await CategoryController.getCombinedAttributes(req, res, next);
  } catch (error) {
    next(error);
  }
});

router.get('/requirements', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await CategoryController.getCategoryRequirements(req, res, next);
  } catch (error) {
    next(error);
  }
});

router.get('/tree', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await CategoryController.getCategoryTree(req, res, next);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await CategoryController.getCategory(req, res, next);
  } catch (error) {
    next(error);
  }
});

router.get('/slug/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await CategoryController.getCategoryBySlug(req, res, next);
  } catch (error) {
    next(error);
  }
});

router.get('/:id/path', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await CategoryController.getCategoryPath(req, res, next);
  } catch (error) {
    next(error);
  }
});



// Protected routes (require authentication)
router.post('/', 
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  (req: Request, res: Response, next: NextFunction) => {
    authorizeRole(['admin'])(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await CategoryController.createCategory(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

router.put('/:id', 
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  (req: Request, res: Response, next: NextFunction) => {
    authorizeRole(['admin'])(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await CategoryController.updateCategory(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

router.delete('/:id', 
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  (req: Request, res: Response, next: NextFunction) => {
    authorizeRole(['admin'])(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await CategoryController.deleteCategory(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

router.post('/:id/attributes', 
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  (req: Request, res: Response, next: NextFunction) => {
    authorizeRole(['admin'])(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await CategoryController.addAttribute(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

router.delete('/:id/attributes/:attributeName', 
  (req: Request, res: Response, next: NextFunction) => {
    verifyToken(req, res, next);
  },
  (req: Request, res: Response, next: NextFunction) => {
    authorizeRole(['admin'])(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await CategoryController.removeAttribute(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

export default router;