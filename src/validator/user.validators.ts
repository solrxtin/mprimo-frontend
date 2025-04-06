import Joi from 'joi';

// Base user schema
const baseUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])')).message('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  role: Joi.string().valid('customer', 'vendor', 'admin'),
  status: Joi.string().valid('active', 'inactive', 'suspended')
});

// Profile schema
const profileSchema = Joi.object({
  firstName: Joi.string().max(50),
  lastName: Joi.string().max(50),
  phoneNumber: Joi.string().pattern(/^[0-9]{10,15}$/),
  avatar: Joi.string().uri()
});

// Address schema
const addressSchema = Joi.object({
  type: Joi.string().valid('billing', 'shipping').required(),
  street: Joi.string().required(),
  city: Joi.string().required(),
  state: Joi.string(),
  country: Joi.string().required(),
  postalCode: Joi.string().required(),
  isDefault: Joi.boolean()
});

// Preferences schema
const preferencesSchema = Joi.object({
  language: Joi.string().valid('en', 'fr', 'es', 'de', 'it'), // Add more as needed
  currency: Joi.string().valid('USD', 'EUR', 'GBP', 'JPY'), // Add more as needed
  notifications: Joi.object({
    email: Joi.boolean(),
    push: Joi.boolean(),
    sms: Joi.boolean()
  }),
  marketing: Joi.boolean()
});

// Social login schema
const socialLoginSchema = Joi.object({
  provider: Joi.string().required(),
  providerId: Joi.string().required()
});

// Export all schemas
export const userValidation = {
  // Create user validation
  createUser: baseUserSchema.keys({
    profile: profileSchema,
    addresses: Joi.array().items(addressSchema),
    socialLogins: Joi.array().items(socialLoginSchema),
    preferences: preferencesSchema
  }),

  // Update user validation
  updateUser: baseUserSchema.optional().keys({
    profile: profileSchema,
    addresses: Joi.array().items(addressSchema),
    socialLogins: Joi.array().items(socialLoginSchema),
    preferences: preferencesSchema
  }),

  // Profile validation
  updateProfile: profileSchema,

  // Address validation
  address: addressSchema,

  // Preferences validation
  preferences: preferencesSchema,

  // Notification preferences validation
  notificationPrefs: Joi.object({
    email: Joi.boolean().required(),
    push: Joi.boolean().required(),
    sms: Joi.boolean().required()
  })
};