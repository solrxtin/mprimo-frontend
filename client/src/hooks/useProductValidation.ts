import { useState } from 'react';

interface ValidationError {
  field: string;
  message: string;
}

interface ProductValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export const useProductValidation = () => {
  const [errors, setErrors] = useState<ValidationError[]>([]);

  const validateProduct = (productData: any): ProductValidationResult => {
    const validationErrors: ValidationError[] = [];

    // Basic validation for required fields
    if (!productData.name?.trim()) {
      validationErrors.push({ field: 'name', message: 'Product name is required' });
    }

    if (!productData.brand?.trim()) {
      validationErrors.push({ field: 'brand', message: 'Brand is required' });
    }

    if (!productData.description?.trim()) {
      validationErrors.push({ field: 'description', message: 'Description is required' });
    }

    if (!productData.condition) {
      validationErrors.push({ field: 'condition', message: 'Condition is required' });
    }

    if (!productData.category?.main) {
      validationErrors.push({ field: 'category', message: 'Main category is required' });
    }

    if (!productData.country) {
      validationErrors.push({ field: 'country', message: 'Country is required' });
    }

    if (!productData.inventory?.listing?.type) {
      validationErrors.push({ field: 'listingType', message: 'Listing type is required' });
    }

    if (!productData.images || productData.images.length === 0) {
      validationErrors.push({ field: 'images', message: 'At least one image is required' });
    } else if (productData.images.length > 10) {
      validationErrors.push({ field: 'images', message: 'Maximum 10 images allowed' });
    }

    if (!productData.shipping) {
      validationErrors.push({ field: 'shipping', message: 'Shipping information is required' });
    } else {
      if (!productData.shipping.weight || productData.shipping.weight <= 0) {
        validationErrors.push({ field: 'weight', message: 'Product weight is required and must be greater than 0' });
      }
    }

    // Validate listing type specific fields
    const listingType = productData.inventory?.listing?.type;
    if (listingType === 'instant') {
      // Instant listings must have variants with pricing
      if (!productData.variants || productData.variants.length === 0) {
        validationErrors.push({ field: 'variants', message: 'Instant listing requires at least one variant' });
      }
    } else if (listingType === 'auction') {
      const auction = productData.inventory?.listing?.auction;
      if (!auction?.startBidPrice || auction.startBidPrice <= 0) {
        validationErrors.push({ field: 'startBidPrice', message: 'Start bid price is required and must be greater than 0' });
      }
      if (!auction?.reservePrice || auction.reservePrice <= 0) {
        validationErrors.push({ field: 'reservePrice', message: 'Reserve price is required and must be greater than 0' });
      }
      if (!auction?.startTime) {
        validationErrors.push({ field: 'startTime', message: 'Auction start time is required' });
      }
      if (!auction?.endTime) {
        validationErrors.push({ field: 'endTime', message: 'Auction end time is required' });
      }
      if (!auction?.bidIncrement || auction.bidIncrement <= 0) {
        validationErrors.push({ field: 'bidIncrement', message: 'Bid increment is required and must be greater than 0' });
      }

      // Validate auction dates
      if (auction?.startTime && auction?.endTime) {
        const now = new Date();
        const startDate = new Date(auction.startTime);
        const endDate = new Date(auction.endTime);

        if (startDate <= now) {
          validationErrors.push({ field: 'startTime', message: 'Auction start time must be in the future' });
        }

        if (endDate <= startDate) {
          validationErrors.push({ field: 'endTime', message: 'Auction end time must be after start time' });
        }
      }
    }

    // Validate specifications
    if (!productData.specifications || productData.specifications.length === 0) {
      validationErrors.push({ field: 'specifications', message: 'Specifications are required' });
    }

    // Validate variants if provided
    if (productData.variants && productData.variants.length > 0) {
      const variantNames = new Set();
      
      productData.variants.forEach((variant: any, variantIndex: number) => {
        // Check for duplicate variant names
        if (variantNames.has(variant.name)) {
          validationErrors.push({ 
            field: `variant-${variantIndex}-name`, 
            message: `Duplicate variant name: ${variant.name}` 
          });
        }
        variantNames.add(variant.name);

        // Validate variant name
        if (!variant.name?.trim()) {
          validationErrors.push({ 
            field: `variant-${variantIndex}-name`, 
            message: 'Variant name is required' 
          });
        }

        // Validate options
        if (!variant.options || variant.options.length === 0) {
          validationErrors.push({ 
            field: `variant-${variantIndex}-options`, 
            message: `Variant ${variant.name} must have at least one option` 
          });
        } else {
          const optionValues = new Set();
          
          variant.options.forEach((option: any, optionIndex: number) => {
            if (optionValues.has(option.value)) {
              validationErrors.push({ 
                field: `variant-${variantIndex}-option-${optionIndex}-value`, 
                message: `Duplicate option value ${option.value} in variant ${variant.name}` 
              });
            }
            optionValues.add(option.value);

            // Validate option fields
            if (!option.value?.trim()) {
              validationErrors.push({ 
                field: `variant-${variantIndex}-option-${optionIndex}-value`, 
                message: 'Option value is required' 
              });
            }

            if (!option.price || option.price < 0.01) {
              validationErrors.push({ 
                field: `variant-${variantIndex}-option-${optionIndex}-price`, 
                message: 'Option price must be at least 0.01' 
              });
            }

            if (option.quantity === undefined || option.quantity < 0) {
              validationErrors.push({ 
                field: `variant-${variantIndex}-option-${optionIndex}-quantity`, 
                message: 'Option quantity cannot be negative' 
              });
            }

            if (!option.sku?.trim()) {
              validationErrors.push({ 
                field: `variant-${variantIndex}-option-${optionIndex}-sku`, 
                message: 'Option SKU is required' 
              });
            }
          });
        }
      });
    }

    setErrors(validationErrors);
    return {
      isValid: validationErrors.length === 0,
      errors: validationErrors
    };
  };

  const clearErrors = () => {
    setErrors([]);
  };

  const getFieldError = (field: string) => {
    return errors.find(error => error.field === field)?.message;
  };

  return {
    validateProduct,
    clearErrors,
    getFieldError,
    errors,
    hasErrors: errors.length > 0
  };
};