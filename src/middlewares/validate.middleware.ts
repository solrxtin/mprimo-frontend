import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

interface ValidationError {
  field: string;
  message: string;
}

export const validate = (schema: Joi.Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      allowUnknown: false
    });

    if (error) {
    const errors: ValidationError[] = error.details.map((detail: Joi.ValidationErrorItem): ValidationError => ({
      field: detail.path.join('.'),
      message: detail.message.replace(/['"]/g, '')
    }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    next();
  };
};