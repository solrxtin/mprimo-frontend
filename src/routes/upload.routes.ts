
import express from 'express';
import { UploadController } from '../controllers/upload.controller';
import { multerConfig } from '../config/multer.config';

const router = express.Router();

router.post(
  '/image',
  multerConfig.uploadImage.single('image'),
  UploadController.uploadImage
);

router.post(
  '/document',
  multerConfig.uploadDocument.single('document'),
  UploadController.uploadImage
);

export default router;
