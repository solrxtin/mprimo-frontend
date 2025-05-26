// src/config/storage.config.ts
import { GridFsStorage } from 'multer-gridfs-storage';
import mongoose from 'mongoose';

interface FileInfo {
  filename: string;
  bucketName: string;
}

export const createGridFsStorage = () => {
  return new GridFsStorage({
    url: process.env.MONGODB_URI || '',
    options: { 
      useNewUrlParser: true, 
      useUnifiedTopology: true 
    },
    file: (_req, file): Promise<FileInfo> => {
      return new Promise((resolve, _reject) => {
        const filename = `${Date.now()}_${file.originalname}`;
        const fileInfo: FileInfo = {
          filename: filename,
          bucketName: 'mprimo-uploads'
        };
        resolve(fileInfo);
      });
    }
  });
};

// Create a connection to MongoDB for GridFS
export const connectGridFS = async (): Promise<void> => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('GridFS connection established');
  } catch (error) {
    console.error('GridFS connection error:', error);
    throw error;
  }
};
