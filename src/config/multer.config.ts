// src/config/multer.config.ts
import multer, { StorageEngine } from 'multer';
import { GridFsStorage } from 'multer-gridfs-storage';


interface MulterConfig {
  uploadImage: multer.Multer;
  uploadDocument: multer.Multer;
}

// Disk Storage Configuration
const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

// GridFS Storage Configuration
const gridFsStorage = new GridFsStorage({
  url: process.env.MONGODB_URI || '',
  options: { useNewUrlParser: true, useUnifiedTopology: true },
  file: (_req, file: Express.Multer.File) => {
    return new Promise((resolve, _reject) => {
      const filename = `${Date.now()}_${file.originalname}`;
      const fileInfo = {
        filename: filename,
        bucketName: 'mprimo-uploads'
      };
      resolve(fileInfo);
    });
  }
}) as unknown as StorageEngine;

// Multer File Filter
const fileFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allowed file types
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG and GIF are allowed.'));
  }
};

// Create Multer configurations
export const multerConfig: MulterConfig = {
  uploadImage: multer({
    storage: diskStorage,
    fileFilter: fileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
      files: 1
    }
  }),
  uploadDocument: multer({
    storage: gridFsStorage,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
      files: 1
    }
  })
};

// Export individual upload middlewares
export const uploadImage = multerConfig.uploadImage.single('image');
export const uploadDocument = multerConfig.uploadDocument.single('document');


