import { NextFunction, Request, Response } from "express";
import Product from "../models/product.model";
import { Types } from "mongoose";
import { ReviewDocument } from "../types/product.type";
import redisService from "../services/redis.service";

// Get all reviews for vendor's products
export const getVendorReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { vendorId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const skip = (Number(page) - 1) * Number(limit);
    
    const reviews = await Product.aggregate([
      { $match: { vendorId: new Types.ObjectId(vendorId) } },
      { $unwind: "$reviews" },
      {
        $lookup: {
          from: "users",
          localField: "reviews.userId",
          foreignField: "_id",
          as: "reviewer"
        }
      },
      {
        $project: {
          vendorId: "$vendorId",
          productName: "$name",
          productId: "$_id",
          productImage: { $arrayElemAt: ["$images", 0] },
          review: {
            _id: "$reviews._id",
            rating: "$reviews.rating",
            comment: "$reviews.comment",
            helpful: { $ifNull: ["$reviews.helpful", []] },
            helpfulCount: { $size: { $ifNull: ["$reviews.helpful", []] } },
            vendorResponse: "$reviews.vendorResponse",
            createdAt: "$reviews.createdAt",
            reviewer: {
              _id: { $arrayElemAt: ["$reviewer._id", 0] },
              name: {
                $concat: [
                  { $arrayElemAt: ["$reviewer.profile.firstName", 0] },
                  " ",
                  { $arrayElemAt: ["$reviewer.profile.lastName", 0] }
                ]
              }
            }
          }
        }
      },
      { $sort: { "review.createdAt": -1 } },
      { $skip: skip },
      { $limit: Number(limit) }
    ]);

    const totalReviews = await Product.aggregate([
      { $match: { vendorId: new Types.ObjectId(vendorId) } },
      { $unwind: "$reviews" },
      { $count: "total" }
    ]);

    const total = totalReviews[0]?.total || 0;
    const hasMore = skip + reviews.length < total;

    res.json({
      success: true,
      reviews,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        hasMore
      }
    });
  } catch (err) {
    next(err);
  }
};

// Add vendor response to review
export const addVendorResponse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId, reviewId } = req.params;
    const { comment } = req.body;
    const userId = req.userId;
    
    if (!comment?.trim()) {
      return res.status(400).json({ success: false, message: "Response comment is required" });
    }

    // First check if product exists and user owns it
    const product = await Product.findById(productId).populate('vendorId', 'userId');
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Check if current user is the product owner
    const vendor = product.vendorId as any;
    if (!vendor?.userId?.equals(userId)) {
      return res.status(403).json({ success: false, message: "Only the product owner can respond to reviews" });
    }

    // Update the review with vendor response
    const updatedProduct = await Product.findOneAndUpdate(
      { 
        _id: productId,
        "reviews._id": reviewId 
      },
      {
        $set: {
          "reviews.$.vendorResponse": {
            comment: comment.trim(),
            createdAt: new Date()
          }
        }
      },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    res.json({ success: true, message: "Vendor response added successfully" });
  } catch (err) {
    next(err);
  }
};

// Toggle helpful on review
export const toggleHelpful = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId, reviewId } = req.params;
    const userId = req.userId;

    const result = await redisService.toggleReviewHelpful(productId, reviewId, userId.toString());
    
    if (result) {
      res.json({ 
        success: true, 
        helpful: result.helpful,
        helpfulCount: result.helpfulCount
      });
    } else {
      // Fallback to database if Redis fails
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ success: false, message: "Product not found" });
      }

      const review = product.reviews.id(reviewId) as ReviewDocument | null;
      if (!review) {
        return res.status(404).json({ success: false, message: "Review not found" });
      }

      const hasLiked = review.helpful.includes(userId);
      
      if (hasLiked) {
        review.helpful.pull(userId);
      } else {
        review.helpful.push(userId);
      }

      await product.save();

      res.json({ 
        success: true, 
        helpful: !hasLiked,
        helpfulCount: review.helpful.length
      });
    }
  } catch (err) {
    next(err);
  }
};