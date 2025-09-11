import Joi from "joi";
import { ROLE_PERMISSIONS } from "../constants/roles.config";

export const createAdminSchema = Joi.object({
  firstName: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .required()
    .messages({
      "string.empty": "First name is required",
      "string.min": "First name must be at least 2 characters",
      "string.max": "First name cannot exceed 50 characters",
    }),

  lastName: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .required()
    .messages({
      "string.empty": "Last name is required",
      "string.min": "Last name must be at least 2 characters",
      "string.max": "Last name cannot exceed 50 characters",
    }),

  email: Joi.string()
    .email()
    .lowercase()
    .required()
    .messages({
      "string.email": "Please provide a valid email address",
      "string.empty": "Email is required",
    }),

  phoneNumber: Joi.string()
    .pattern(/^\+?[1-9]\d{0,3}[-\s]?\(?\d{2,4}\)?[-\s]?\d{3,4}[-\s]?\d{3,4}$/)
    .optional()
    .messages({
      "string.pattern.base": "Please provide a valid international phone number format",
    }),

  country: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .optional()
    .messages({
      "string.min": "Country must be at least 2 characters",
      "string.max": "Country cannot exceed 50 characters",
    }),

  state: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .optional()
    .messages({
      "string.min": "State must be at least 2 characters",
      "string.max": "State cannot exceed 50 characters",
    }),

  adminRole: Joi.string()
    .valid(...Object.keys(ROLE_PERMISSIONS))
    .required()
    .messages({
      "any.only": "Invalid admin role provided",
      "string.empty": "Admin role is required",
    }),

  permissions: Joi.array()
    .items(Joi.string())
    .optional()
    .default([])
    .messages({
      "array.base": "Permissions must be an array of strings",
    }),

  enable2FA: Joi.boolean()
    .optional()
    .default(false)
    .messages({
      "boolean.base": "enable2FA must be a boolean value",
    }),

  profileImageUrl: Joi.string()
    .uri()
    .optional()
    .messages({
      "string.uri": "Profile image must be a valid URL",
    }),
});


export const changeRoleSchema = Joi.object({
  newRole: Joi.string()
    .valid(...Object.keys(ROLE_PERMISSIONS))
    .required()
    .messages({
      "any.only": "Invalid admin role provided",
      "string.empty": "New role is required",
    }),

  permissions: Joi.array()
    .items(Joi.string())
    .optional()
    .default([])
    .messages({
      "array.base": "Permissions must be an array of strings",
    }),
});

export const validateCreateAdmin = (data: any) => {
  return createAdminSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });
};


export const validateChangeRole = (data: any) => {
  return changeRoleSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });
};