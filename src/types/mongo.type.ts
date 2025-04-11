import { Error } from 'mongoose';

export interface MongoError extends Error {
  code?: number;
  keyPattern?: { [key: string]: number };
  keyValue?: { [key: string]: any };
  writeErrors?: Array<{
    code: number;
    index: number;
    errmsg: string;
  }>;
}

// More specific error types
export interface MongoDuplicateKeyError extends MongoError {
  code: 11000;
  keyPattern: { [key: string]: number };
  keyValue: { [key: string]: any };
}

export interface MongoValidationError extends Error.ValidationError {
  errors: {
    [key: string]: Error.ValidatorError | Error.CastError;
  };
}

// Type guards for error checking
export const isMongoDuplicateKeyError = (error: any): error is MongoDuplicateKeyError => {
  return error?.code === 11000;
};

export const isMongoValidationError = (error: any): error is MongoValidationError => {
  return error?.name === 'ValidationError';
};

export const isMongoError = (error: any): error is MongoError => {
  return error?.code !== undefined && typeof error?.code === 'number';
};