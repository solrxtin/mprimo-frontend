import mongoose from "mongoose";
import { Cart, Wishlist } from "../types/cart.type";


// Wishlist Schema with embedded validators
const wishlistSchema = new mongoose.Schema<Wishlist>(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User",
      required: [true, 'User ID is required']
    },
    items: [
      {
        productId: { 
          type: mongoose.Schema.Types.ObjectId, 
          ref: "Product",
          required: [true, 'Product ID is required'],
          validate: {
            validator: function(value: mongoose.Types.ObjectId) {
              return mongoose.Types.ObjectId.isValid(value);
            },
            message: 'Invalid product ID format'
          }
        },
        addedAt: {
          type: Date,
          default: Date.now,
          validate: {
            validator: function(value: Date) {
              return value <= new Date();
            },
            message: 'Added date cannot be in the future'
          }
        },
        priceWhenAdded: {
          type: Number,
          min: [0, 'Price cannot be negative'],
          validate: {
            validator: function(value: number) {
              // Allow undefined but validate if provided
              return value === undefined || !isNaN(value);
            },
            message: 'Price must be a valid number'
          }
        }
      }
    ]
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Cart Schema with embedded validators
const cartSchema = new mongoose.Schema<Cart>({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User",
    required: [true, 'User ID is required']
  },
  items: [
    {
      productId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Product",
        required: [true, 'Product ID is required'],
        validate: {
          validator: function(value: mongoose.Types.ObjectId) {
            return mongoose.Types.ObjectId.isValid(value);
          },
          message: 'Invalid product ID format'
        }
      },
      quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [1, 'Quantity must be at least 1'],
        validate: {
          validator: async function(value: number) {
            // Dynamic stock validation
            const product = await mongoose.model('Product').findById((this as any).productId);
            return product && product.stock >= value;
          },
          message: 'Quantity exceeds available stock'
        }
      }
    }
  ],
  lastUpdated: {
    type: Date,
    default: Date.now,
    validate: {
      validator: function(value: Date) {
        return value <= new Date();
      },
      message: 'Last updated date cannot be in the future'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for wishlist item count
wishlistSchema.virtual('itemCount').get(function() {
  return this.items.length;
});

// Virtual for cart total value
cartSchema.virtual('totalValue').get(async function() {
  await this.populate('items.productId');
  return this.items.reduce((total, item) => {
    const product = item.productId as any;
    const price = product.price * (1 - (product.discountPercentage || 0) / 100);
    return total + (price * item.quantity);
  }, 0);
});

// Pre-save hook for cart to update lastUpdated
cartSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Pre-validate hook for wishlist to prevent duplicates
wishlistSchema.pre('validate', function(next) {
  const productIds = new Set();
  for (const item of this.items) {
    if (productIds.has(item.productId.toString())) {
      this.invalidate('items', 'Duplicate product in wishlist', item.productId);
    }
    productIds.add(item.productId.toString());
  }
  next();
});

// Static methods for Cart
cartSchema.statics.findByUserId = function(userId: string) {
  return this.findOne({ userId })
    .populate('items.productId', 'name price images stock discountPercentage');
};
wishlistSchema.statics.findByUserId = function (userId: string) {
  return this.findOne({ userId }).populate('items.productId', 'name price images discountPercentage');
};


wishlistSchema.set('toJSON', { virtuals: true });
wishlistSchema.set('toObject', { virtuals: true });

const WishList = mongoose.model<Wishlist>("Wishlist", wishlistSchema);
const Cart = mongoose.model<Cart>("Cart", cartSchema);

export { WishList, Cart };