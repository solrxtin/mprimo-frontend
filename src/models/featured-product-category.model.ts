import mongoose from "mongoose";


const FeaturedProductCategorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    isActive: { type: Boolean, default: true },
}, {
    timestamps: true,
})