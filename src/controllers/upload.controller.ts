import { Request, Response, NextFunction } from "express";
import { UploadService } from "../services/upload.service";
import mongoose from "mongoose";
import {
  BaseUploadedFile,
  isDiskUploadedFile,
} from "../types/file.type";

export class UploadController {
  static async uploadImage(
    req: Request & { file?: BaseUploadedFile },
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.file || !isDiskUploadedFile(req.file)) {
        res.status(400).json({
          success: false,
          message: "No image provided",
        });
        return;
      }

      const result = await UploadService.uploadImage(
        req.file,
        req.userId.toString()
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async uploadDocument(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: "No document provided",
        });
        return;
      }

      // Get the file stored in GridFS
      const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db!, {
        bucketName: "mprimo-uploads",
      });

      const files = await bucket
        .find({ filename: req.file.filename })
        .toArray();
      if (!files.length) {
        res
          .status(500)
          .json({ success: false, message: "File not found in storage" });
        return;
      }

      const storedFile = files[0];

      const fileData = {
        filename: req.file.filename,
        id: storedFile._id,
      };

      res.status(200).json({ success: true, file: fileData });
    } catch (error) {
      next(error);
    }
  }

  static async getDocument(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const bucket = await UploadService.getDocument(req.params.id);
      const downloadStream = bucket.openDownloadStream(
        new mongoose.Types.ObjectId(req.params.id)
      );
      res.set("Content-Type", "application/octet-stream");
      downloadStream.pipe(res);
    } catch (error) {
      next(error);
    }
  }
}
