import mongoose from "mongoose";
import { Product } from "../types/product.type";

const productSchema = new mongoose.Schema<Product>({
  vendorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Vendor",
    required: [true, 'Vendor ID is required']
  },
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    minlength: [3, 'Product name must be at least 3 characters'],
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    minlength: [10, 'Description must be at least 10 characters'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  category: {
    main: {
      type: String,
      required: [true, 'Main category is required'],
      enum: {
        values: ['Electronics', 'Clothing', 'Home', 'Beauty', 'Sports', 'Other'],
        message: 'Invalid main category'
      }
    },
    sub: {
      type: String,
      required: [false, 'Sub-category is required']
    }
  },
  price: {
    amount: {
      type: Number,
      required: [true, 'Price amount is required'],
      min: [0.01, 'Price must be at least 0.01'],
      max: [1000000, 'Price cannot exceed 1,000,000']
    },
    currency: {
      type: String,
      required: [true, 'Currency is required'],
      enum: {
        values: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CNY', 'INR', 'NGN'],
        message: 'Invalid currency'
      },
      uppercase: true,
      default: 'USD'
    }
  },
  inventory: {
    quantity: {
      type: Number,
      required: [true, 'Inventory quantity is required'],
      min: [0, 'Inventory cannot be negative'],
      default: 0
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      trim: true,
      validate: {
        validator: function(v: string) {
          return /^[A-Z0-9\-]{5,20}$/.test(v);
        },
        message: 'SKU must be 5-20 alphanumeric characters with optional hyphens'
      }
    },
    lowStockAlert: {
      type: Number,
      min: [1, 'Low stock alert must be at least 1'],
      default: 5
    }
  },
  images: {
    type: [String],
    validate: {
      validator: function(v: string[]) {
        return v.length >= 1 && v.length <= 10;
      },
      message: 'Must have between 1 and 10 images'
    },
    required: [true, 'At least one image is required']
  },
  specifications: [{
    key: {
      type: String,
      required: [true, 'Specification key is required'],
      trim: true,
      maxlength: [50, 'Key cannot exceed 50 characters']
    },
    value: {
      type: String,
      required: [true, 'Specification value is required'],
      maxlength: [200, 'Value cannot exceed 200 characters']
    }
  }],
  shipping: {
    weight: {
      type: Number,
      required: [true, 'Weight is required'],
      min: [0.01, 'Weight must be at least 0.01'],
      max: [500, 'Weight cannot exceed 500']
    },
    dimensions: {
      length: {
        type: Number,
        required: [true, 'Length is required'],
        min: [0.1, 'Length must be at least 0.1'],
        max: [200, 'Length cannot exceed 200']
      },
      width: {
        type: Number,
        required: [true, 'Width is required'],
        min: [0.1, 'Width must be at least 0.1'],
        max: [200, 'Width cannot exceed 200']
      },
      height: {
        type: Number,
        required: [true, 'Height is required'],
        min: [0.1, 'Height must be at least 0.1'],
        max: [200, 'Height cannot exceed 200']
      }
    },
    restrictions: {
      type: [String],
      enum: {
        values: ['hazardous', 'fragile', 'perishable', 'oversized', 'none'],
        message: 'Invalid shipping restriction'
      },
      default: ['none']
    }
  },
  status: { 
    type: String, 
    enum: {
      values: ["active", "inactive", "outOfStock"],
      message: 'Invalid product status'
    },
    default: 'active'
  },
  reviews: [
    {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, "Comment cannot exceed 500 characters"]
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  rating: {
    type: Number,
    min: [0, "Rating cannot be negative"],
    max: [5, "Rating cannot exceed 5"],
    default: 0
  },
  variants: [{
    name: {
      type: String,
      required: [true, 'Variant name is required'],
      trim: true,
      maxlength: [50, 'Variant name cannot exceed 50 characters']
    },
    options: [{
      value: {
        type: String,
        required: [true, 'Option value is required'],
        trim: true,
        maxlength: [50, 'Option value cannot exceed 50 characters']
      },
      price: {
        type: Number,
        required: [true, 'Option price is required'],
        min: [0.01, 'Price must be at least 0.01']
      },
      inventory: {
        type: Number,
        required: [true, 'Option inventory is required'],
        min: [0, 'Inventory cannot be negative']
      }
    }]
  }],
  analytics: {
    views: {
      type: Number,
      min: [0, 'Views cannot be negative'],
      default: 0
    },
    purchases: {
      type: Number,
      min: [0, 'Purchases cannot be negative'],
      default: 0
    },
    conversionRate: {
      type: Number,
      min: [0, 'Conversion rate cannot be negative'],
      max: [100, 'Conversion rate cannot exceed 100'],
      default: 0
    }
  },
  allowOffer: {
    type: Boolean,
    default: false
  },
  offers: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    userOffers: [{
      amount: {type: Number},
      accepted: {
        type: Boolean,
        default: false
      }
    }]
  }]
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  },
  toObject: {
    virtuals: true
  }
});

// Indexes for better performance
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ 'category.main': 1, 'category.sub': 1 });
productSchema.index({ 'price.amount': 1 });
productSchema.index({ 'inventory.quantity': 1 });
productSchema.index({ status: 1 });

// Middleware to validate variant options before saving
productSchema.pre('save', function(next) {
  if (this.variants && this.variants.length > 0) {
    const variantNames = new Set();
    for (const variant of this.variants) {
      // Check for duplicate variant names
      if (variantNames.has(variant.name)) {
        throw new Error(`Duplicate variant name: ${variant.name}`);
      }
      variantNames.add(variant.name);
      
      // Validate options
      if (!Array.isArray(variant.options) || variant?.options?.length < 1) {
        throw new Error(`Variant ${variant.name} must have at least one option`);
      }
      
      const optionValues = new Set();
      for (const option of variant.options) {
        if (optionValues.has(option.value)) {
          throw new Error(`Duplicate option value ${option.value} in variant ${variant.name}`);
        }
        optionValues.add(option.value);
      }
    }
  }
  next();
});

const Product = mongoose.model<Product>("Product", productSchema);

export default Product;