// src/models/category.model.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

// Interface for the category document
export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  parent?: mongoose.Types.ObjectId;
  level: number;
  path: string[];
  children?: ICategory[];
  attributes: {
    name: string;
    type: 'text' | 'number' | 'boolean' | 'select';
    required: boolean;
    options?: string[];
  }[];
  image?: string;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  metadata?: Record<string, any>;
}

// Interface for category model static methods
export interface ICategoryModel extends Model<ICategory> {
  findBySlug(slug: string): Promise<ICategory | null>;
  buildCategoryTree(categories: ICategory[]): ICategory[];
}

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      required: true,
      // unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    parent: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    level: {
      type: Number,
      default: 1,
    },
    path: [{
      type: String,
      required: true,
    }],
    attributes: [{
      name: {
        type: String,
        required: true,
        trim: true,
      },
      type: {
        type: String,
        enum: ['text', 'number', 'boolean', 'select'],
        required: true,
      },
      required: {
        type: Boolean,
        default: false,
      },
      options: [{
        type: String,
        trim: true,
      }],
    }],
    image: {
      type: String,
      validate: {
        validator: (v: string) => /^https?:\/\/.+/.test(v),
        message: 'Invalid image URL',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for children categories
categorySchema.virtual('children', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent',
});

// Indexes
categorySchema.index({ slug: 1 });
categorySchema.index({ parent: 1 });
categorySchema.index({ path: 1 });
categorySchema.index({ 'attributes.name': 1 });

// Static methods
categorySchema.statics.findBySlug = function(slug: string): Promise<ICategory | null> {
  return this.findOne({ slug })
    .populate('children')
    .populate('parent', 'name slug');
};

categorySchema.statics.buildCategoryTree = function(categories: ICategory[]): ICategory[] {
  const categoryMap = new Map<string, ICategory>();
  const roots: ICategory[] = [];

  // First pass: create map of categories
  categories.forEach(category => {
    categoryMap.set(category._id!.toString(), category);
  });

  // Second pass: build tree structure
  categories.forEach(category => {
    if (category.parent) {
      const parent = categoryMap.get(category.parent.toString());
      if (parent) {
        if (!parent.children) parent.children = [];
        parent.children.push(category);
      }
    } else {
      roots.push(category);
    }
  });

  return roots;
};

// Pre-save middleware
categorySchema.pre('save', async function(next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  if (this.isModified('parent') || this.isModified('name')) {
    const CategoryModel = mongoose.model<ICategory, ICategoryModel>('Category');
    
    if (this.parent) {
      const parentCategory = await CategoryModel.findById(this.parent);
      if (parentCategory) {
        this.path = [...parentCategory.path, this.slug];
        this.level = parentCategory.level + 1;
      }
    } else {
      this.path = [this.slug];
      this.level = 1;
    }
  }

  next();
});

// Create and export the model
const CategoryModel = mongoose.model<ICategory, ICategoryModel>('Category', categorySchema);
export default CategoryModel;
