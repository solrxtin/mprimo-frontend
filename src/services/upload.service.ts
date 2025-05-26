// src/services/upload.service.ts
import fs from 'fs';
import util from 'util';
import crypto from 'crypto';
import cloudinary from '../config/cloudinary.config';
import createError from 'http-errors';
import mongoose, { ObjectId } from 'mongoose';
import { GridFSFile, BaseUploadedFile, DiskUploadedFile } from '../types/file.type';

const readFile = util.promisify(fs.readFile);

export interface UploadResult {
  success: boolean;
  message: string;
  fileUrl?: string;
  fileId?: string;
  error?: string;
}


export class UploadService {
  private static async calculateHash(filePath: string): Promise<string> {
    try {
      const fileBuffer = await readFile(filePath);
      return crypto.createHash("sha1").update(fileBuffer).digest("hex");
    } catch (error) {
      throw createError(500, 'Error calculating file hash');
    }
  }

  private static async searchImageByHashAndUser(hash: string, userId: string): Promise<string | null> {
    try {
      const searchResult = await cloudinary.search
        .expression(`context.hash=${hash} AND context.user_id=${userId}`)
        .max_results(1)
        .execute();
      return searchResult.resources.length > 0
        ? searchResult.resources[0].secure_url
        : null;
    } catch (error) {
      throw createError(500, 'Error searching image');
    }
  }

  private static async uploadToCloudinary(
    filePath: string,
    hash: string,
    userId: string
  ): Promise<{ secure_url: string }> {
    try {
      return await cloudinary.uploader.upload(filePath, {
        public_id: `product-images/${hash}`,
        context: {
          hash,
          userId
        },
        transformation: [
          {
            overlay: {
              font_family: "Arial",
              font_size: 16,
              font_weight: "bold",
              text: "Mprimo",
            },
            gravity: "south",
            color: "#F5F5F5",
            background: "#000000",
            opacity: 50,
          },
        ],
      });
    } catch (error) {
      throw createError(500, 'Error uploading to Cloudinary');
    }
  }

  static async uploadImage(file: DiskUploadedFile, userId: string): Promise<UploadResult> {
    try {
      if (!file) {
        throw createError(400, 'No image provided');
      }

      const filePath = file.path;
      const fileHash = await this.calculateHash(filePath);
      const existingUrl = await this.searchImageByHashAndUser(fileHash, userId);

      if (existingUrl) {
        this.cleanupFile(filePath);
        return {
          success: true,
          message: "Image already exists!",
          fileUrl: existingUrl,
        };
      }

      const result = await this.uploadToCloudinary(filePath, fileHash, userId);
      this.cleanupFile(filePath);

      return {
        success: true,
        message: "Image uploaded successfully!",
        fileUrl: result.secure_url,
      };
    } catch (error: any) {
      this.cleanupFile(file?.path);
      throw error;
    }
  }

//   static async uploadDocument(fileId: string): Promise<UploadResult> {
//     try {
//       if (!fileId) {
//         throw createError(400, 'No document provided');
//       }

//       return {
//         success: true,
//         message: "Document uploaded successfully!",
//         fileId,
//         fileUrl: `/api/documents/${fileId}`
//       };
//     } catch (error: any) {
//       throw createError(500, 'Error uploading document');
//     }
//   }

  static async getDocument(fileId: string): Promise<mongoose.mongo.GridFSBucket> {
    try {
      const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db!, {
        bucketName: 'uploads'
      });

      const file = await bucket.find({ _id: new mongoose.Types.ObjectId(fileId) }).next();
      if (!file) {
        throw createError(404, 'Document not found');
      }

      return bucket;
    } catch (error) {
      throw createError(500, 'Error retrieving document');
    }
  }

  private static cleanupFile(filePath: string): void {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}
