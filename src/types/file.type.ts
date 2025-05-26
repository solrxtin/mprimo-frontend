// src/types/file.type.ts
import { Express } from 'express';
import { ObjectId } from 'mongodb';

// Base interface for uploaded files
export interface BaseUploadedFile extends Express.Multer.File {
  id?: string | ObjectId;
}

// Interface for files stored in GridFS
export interface GridFSFile extends BaseUploadedFile {
  _id: ObjectId;
  length: number;
  chunkSize: number;
  uploadDate: Date;
  filename: string;
  md5: string;
  metadata?: any;
}

// Interface for files stored on disk
export interface DiskUploadedFile extends BaseUploadedFile {
  path: string;
  destination: string;
}

// Type guards
export function isGridFSFile(file: any): file is GridFSFile {
  return '_id' in file && 
         'length' in file && 
         'chunkSize' in file && 
         'uploadDate' in file;
}

export function isDiskUploadedFile(file: any): file is DiskUploadedFile {
  return 'path' in file && 'destination' in file;
}
