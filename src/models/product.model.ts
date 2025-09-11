import mongoose, { CallbackError } from "mongoose";
import { ProductType } from "../types/product.type";
import crypto from "crypto";
import Vendor from "./vendor.model";
import slugify from 'slugify';

function generateSKU() {
  // Random 12-character alphanumeric string (uppercase)
  return crypto.randomBytes(6).toString("hex").toUpperCase(); // e.g. 'A1B2C3D4'
}

interface Attribute {
  name: string;
  type: "text" | "number" | "boolean" | "select";
  required?: boolean;
  options?: string[];
}

const productSchema = new mongoose.Schema<ProductType>(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: [true, "Vendor ID is required"],
    },
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      minlength: [3, "Product name must be at least 3 characters"],
      maxlength: [100, "Product name cannot exceed 100 characters"],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    brand: {
      type: String,
      required: [true, "Brand name is required"],
      trim: true,
      minlength: [1, "Brand name must be at least 1 characters"],
      maxlength: [100, "Brand name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      minlength: [10, "Description must be at least 10 characters"],
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    condition: {
      type: String,
      required: [true, "Product's condition is required"],
      trim: true,
      enum: ["new", "used", "refurbished"],
    },
    conditionDescription: {
      type: String,
      validate: {
        validator: function (value: string) {
          // If value is undefined or empty, skip validation
          if (!value) return true;
          return value.length >= 10 && value.length <= 2000;
        },
        message: "Condition description must be between 10 and 2000 characters",
      },
    },
    category: {
      type: {
        main: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Category",
          required: [true, "Main category is required"],
        },
        sub: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
          },
        ],
        path: [
          {
            type: String,
          },
        ],
      },
      required: true,
    },
    country: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Country is required"],
      ref: "Country",
    },
    inventory: {
      sku: {
        type: String,
        unique: true,
        trim: true,
        validate: {
          validator: function (v: string) {
            return /^[A-Z0-9\-]{5,20}$/.test(v);
          },
          message:
            "SKU must be 5-20 alphanumeric characters with optional hyphens",
        },
      },
      lowStockAlert: {
        type: Number,
        min: [1, "Low stock alert must be at least 1"],
        default: 2,
      },
      listing: {
        type: {
          type: String,
          enum: ["instant", "auction"],
          required: [true, "Listing type is required"],
        },
        instant: {
          acceptOffer: { type: Boolean, default: false },
          // Removed price, salePrice, quantity - handled by variants
        },
        auction: {
          startBidPrice: {
            type: Number,
            required: function (this: any) {
              return this.inventory?.listing?.type === "auction";
            },
          },
          reservePrice: {
            type: Number,

            required: function (this: any) {
              return this.inventory?.listing?.type === "auction";
            },
          },
          buyNowPrice: {
            type: Number,
          },
          finalPrice: {
            type: Number,
          },
          startTime: {
            type: Date,
            required: function (this: any) {
              return this.inventory?.listing?.type === "auction";
            },
          },
          endTime: {
            type: Date,
            required: function (this: any) {
              return this.inventory?.listing?.type === "auction";
            },
          },
          quantity: {
            type: Number,
            default: 1,

            min: [1, "Auction quantity must be at least 1"],
          },
          bidIncrement: {
            type: Number,
            required: function (this: any) {
              return this.inventory?.listing?.type === "auction";
            },
            default: 1.0,
            min: [0.01, "Bid increment must be at least 0.01"],
          },
          isStarted: {
            type: Boolean,
            default: false
          },
          isExpired: {
            type: Boolean,
            default: false
          },
          reservePriceMet: {
            type: Boolean,
            default: false
          },
          relistCount: {
            type: Number,
            default: 0
          },
          priorityScore: {
            type: Number,
            default: 100
          }
        },
      },
    },
    images: {
      type: [String],
      validate: {
        validator: function (v: string[]) {
          return v.length >= 1 && v.length <= 10;
        },
        message: "Must have between 1 and 10 images",
      },
      required: [true, "At least one image is required"],
    },
    specifications: [
      {
        key: {
          type: String,
          required: [true, "Specification key is required"],
          trim: true,
          maxlength: [50, "Key cannot exceed 50 characters"],
        },
        value: {
          type: String,
          required: [true, "Specification value is required"],
          maxlength: [200, "Value cannot exceed 200 characters"],
        },
      },
    ],
    shipping: {
      weight: {
        type: Number,
        required: [true, "Weight is required"],
        min: [0.01, "Weight must be at least 0.01"],
        max: [500, "Weight cannot exceed 500"],
      },
      unit: {
        type: String,
        enum: {
          values: ["kg", "lbs"],
          message: "Invalid weight unit",
        },
        default: "kg",
      },
      dimensions: {
        length: {
          type: Number,
          validate: {
            validator: function (value: number) {
              if (value === undefined || value === null || value === 0)
                return true;
              return value >= 0.1 && value <= 200;
            },
            message: "Length must be between 0.1 and 200",
          },
        },

        width: {
          type: Number,
          validate: {
            validator: function (value: number) {
              if (value === undefined || value === null || value === 0)
                return true;
              return value >= 0.1 && value <= 200;
            },
            message: "Width must be between 0.1 and 200",
          },
        },

        height: {
          type: Number,
          validate: {
            validator: function (value: number) {
              if (value === undefined || value === null || value === 0)
                return true;
              return value >= 0.1 && value <= 200;
            },
            message: "Height must be between 0.1 and 200",
          },
        },
      },
      restrictions: {
        type: [String],
        enum: {
          values: ["hazardous", "fragile", "perishable", "oversized", "none"],
          message: "Invalid shipping restriction",
        },
        default: ["none"],
      },
    },
    status: {
      type: String,
      enum: {
        values: ["active", "inactive", "outOfStock"],
        message: "Invalid product status",
      },
      default: "active",
    },
    reviews: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
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
          maxlength: [500, "Comment cannot exceed 500 characters"],
        },
        helpful: [{
          type: mongoose.Schema.Types.ObjectId,
          ref: "User"
        }],
        vendorResponse: {
          comment: {
            type: String,
            trim: true,
            maxlength: [500, "Vendor response cannot exceed 400 characters"],
          },
          createdAt: {
            type: Date,
            default: Date.now,
          },
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    rating: {
      type: Number,
      min: [0, "Rating cannot be negative"],
      max: [5, "Rating cannot exceed 5"],
      default: 0,
    },
    variants: [
      {
        name: {
          type: String,
          required: [true, "Variant name is required"],
          trim: true,
          maxlength: [50, "Variant name cannot exceed 50 characters"],
        },
        isDefault: {
          type: Boolean,
          default: false,
        },
        options: [
          {
            value: {
              type: String,
              required: [true, "Option value is required"],
              trim: true,
              maxlength: [50, "Option value cannot exceed 50 characters"],
            },
            sku: {
              type: String,
              required: [true, "Option SKU is required"],
              unique: true,
            },
            price: {
              type: Number,
              required: [true, "Option price is required"],
              min: [0.01, "Price must be at least 0.01"],
            },
            salePrice: {
              type: Number,
              min: [0.01, "Sale price must be at least 0.01"],
            },
            quantity: {
              type: Number,
              required: [true, "Option quantity is required"],
              min: [0, "Quantity cannot be negative"],
            },
            isDefault: {
              type: Boolean,
              default: false,
            },
          },
        ],
      },
    ],
    analytics: {
      views: {
        type: Number,
        min: [0, "Views cannot be negative"],
        default: 0,
      },
      addToCart: {
        type: Number,
        min: [0, "Add to cart count cannot be negative"],
        default: 0,
      },
      wishlist: {
        type: Number,
        min: [0, "Wishlist count cannot be negative"],
        default: 0,
      },
      purchases: {
        type: Number,
        min: [0, "Purchases cannot be negative"],
        default: 0,
      },
      conversionRate: {
        type: Number,
        min: [0, "Conversion rate cannot be negative"],
        max: [100, "Conversion rate cannot exceed 100"],
        default: 0,
      },
    },
    offers: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        userOffers: [
          {
            amount: { type: Number },
            accepted: {
              type: Boolean,
              default: false,
            },
            rejected: {
              type: Boolean,
              default: false,
            },
            createdAt: {
              type: Date,
              default: Date.now,
            },
          },
        ],
        counterOffers: [
          {
            amount: { type: Number },
            createdAt: {
              type: Date,
              default: Date.now,
            },
            accepted: {
              type: Boolean,
              default: false,
            },
            rejected: {
              type: Boolean,
              default: false,
            },
          },
        ],
      },
    ],
    bids: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        maxAmount: {
          type: Number,
          required: true,
          min: [0.01, "Bid amount must be at least 0.01"],
        },
        currentAmount: {
          type: Number,
          required: true
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        isWinning: {
          type: Boolean,
          default: false,
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
    },
  }
);

// Indexes for better performance
productSchema.index({ name: "text", description: "text" });
productSchema.index({ "category.main": 1 });
productSchema.index({ "category.sub": 1 });
productSchema.index({ "price.amount": 1 });
productSchema.index({ "inventory.quantity": 1 });
productSchema.index({ status: 1 });

productSchema.pre('validate', async function (next) {
  if (this.isModified('name') || !this.slug) {
    const baseSlug = slugify(this.name, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 0;

    // Check for uniqueness in the database
    while (await mongoose.models.Product.findOne({ slug })) {
      counter++;
      const randomSuffix = Math.floor(1000 + Math.random() * 9000); // e.g. 5632
      slug = `${baseSlug}-${randomSuffix}`;
      if (counter > 5) break; // avoid infinite loop
    }

    this.slug = slug;
  }
  next();
});

// Pre-save middleware to update category path
productSchema.pre("save", async function (next) {
  // Validate variants
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
        throw new Error(
          `Variant ${variant.name} must have at least one option`
        );
      }

      const optionValues = new Set();
      for (const option of variant.options) {
        if (optionValues.has(option.value)) {
          throw new Error(
            `Duplicate option value ${option.value} in variant ${variant.name}`
          );
        }
        optionValues.add(option.value);
      }
    }
  }

  // Validate specifications against category attributes
  if (
    this.isModified("specifications") ||
    this.isModified("category.main") ||
    this.isModified("category.sub")
  ) {
    try {
      const CategoryModel = mongoose.model("Category");
      const mainCategory = await CategoryModel.findById(this.category.main);

      if (!mainCategory) {
        throw new Error("Main category not found");
      }

      // Save the full path of the category in product
      this.category.path = mainCategory.path;

      // Get all required attributes from main category
      const requiredAttributes = mainCategory.attributes.filter(
        (attr: Attribute) => attr.required
      );

      // Check if all required attributes are included in specifications
      for (const attr of requiredAttributes) {
        const hasAttribute = this.specifications.some(
          (spec) => spec.key === attr.name
        );

        if (!hasAttribute) {
          throw new Error(
            `Required attribute "${attr.name}" is missing from specifications`
          );
        }
      }

      // Validate attribute values based on their types
      for (const spec of this.specifications) {
        const matchingAttr = mainCategory.attributes.find(
          (attr: Attribute) => attr.name === spec.key
        );

        if (matchingAttr) {
          // Validate based on attribute type
          switch (matchingAttr.type) {
            case "number":
              if (isNaN(Number(spec.value))) {
                throw new Error(`Specification "${spec.key}" must be a number`);
              }
              break;
            case "boolean":
              if (spec.value !== "true" && spec.value !== "false") {
                throw new Error(
                  `Specification "${spec.key}" must be a boolean (true/false)`
                );
              }
              break;
            case "select":
              if (
                matchingAttr.options &&
                !matchingAttr.options.includes(spec.value)
              ) {
                throw new Error(
                  `Specification "${
                    spec.key
                  }" must be one of: ${matchingAttr.options.join(", ")}`
                );
              }
              break;
          }
        }
      }
    } catch (error) {
      return next(error as Error);
    }
  }

  const listing = this.inventory?.listing;
  if (!listing || !listing.type) {
    throw new Error("Listing type is required in inventory");
  }

  if (listing.type === "instant") {
    // Validate that variants exist and have required data
    if (!this.variants || this.variants.length === 0) {
      throw new Error("Instant listing must have at least one variant");
    }
    
    // Validate each variant has at least one option with price and quantity
    for (const variant of this.variants) {
      if (!variant.options || variant.options.length === 0) {
        throw new Error(`Variant ${variant.name} must have at least one option`);
      }
      
      for (const option of variant.options) {
        if (option.price == null || option.quantity == null) {
          throw new Error(`Variant option ${option.value} must have price and quantity`);
        }
      }
    }

    if (this.inventory && !this.inventory.sku) {
      let newSKU;
      let isUnique = false;
      const Product = mongoose.model("Product");

      // Retry SKU generation until a unique one is found
      while (!isUnique) {
        newSKU = generateSKU();
        const existing = await Product.findOne({ "inventory.sku": newSKU });
        if (!existing) isUnique = true;
      }

      this.inventory.sku = newSKU;
    }
  } else if (listing.type === "auction") {
    const requiredAuctionFields = [
      "startBidPrice",
      "reservePrice",
      "startTime",
      "endTime",
    ] as const;

    for (const field of requiredAuctionFields) {
      if (
        listing.auction &&
        field in listing.auction &&
        listing.auction[field] == null
      ) {
        throw new Error(`Auction listing must include ${field}`);
      }
    }
  }

  next();
});

productSchema.post("save", async function (doc, next) {
  try {
    // Update product count for the vendor
    await Vendor.findByIdAndUpdate(doc.vendorId, {
      $inc: { "analytics.productCount": 1 },
    });

    // ⭐ If product has reviews, update vendor ratings
    if (doc.reviews && doc.reviews.length > 0) {
      const ratings = doc.reviews.map((review: any) => review.rating);
      const ratingSum = ratings.reduce((acc, r) => acc + r, 0);
      const average = parseFloat((ratingSum / ratings.length).toFixed(2));
      const count = ratings.length;

      await Vendor.findByIdAndUpdate(
        doc.vendorId,
        {
          $set: {
            "ratings.average": average,
            "ratings.count": count,
            "analytics.averageRating": average
          }
        },
        { new: true }
      );
    }

    next();
  } catch (err) {
    next(err as CallbackError);
  }
});

productSchema.post("findOneAndDelete", async function (doc, next) {
  if (doc) {
    try {
      await Vendor.findByIdAndUpdate(doc.vendorId, {
        $inc: { "analytics.productCount": -1 },
      });
    } catch (err) {
      return next(err as CallbackError);
    }
  }
  next();
});


const productDraftSchema = new mongoose.Schema(
  {
    draftId: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    productDetails: {
      type: Object,
      required: true,
    },
    step: {
      type: Number,
      default: 1,
    },
    savedOnMobile: {
      type: Boolean,
      default: false,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    title: String,
    completionPercentage: Number,
  },
  { timestamps: true }
);

// Compound index for faster lookups
productDraftSchema.index({ draftId: 1, userId: 1 }, { unique: true });

export const ProductDraft = mongoose.model("ProductDraft", productDraftSchema);

const Product = mongoose.model<ProductType>("Product", productSchema);

export default Product;
