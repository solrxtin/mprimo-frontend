import Joi from 'joi';

export const orderValidation = {
  createOrder: Joi.object({
    paymentMethod: Joi.string().valid('credit_card', 'paypal', 'bank_transfer').required(),
    shippingAddressId: Joi.string().hex().length(24).required()
      .messages({
        'string.hex': 'Invalid address ID format',
        'string.length': 'Address ID must be 24 characters long'
      })
  })
};