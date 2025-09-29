import { NextFunction, Request, Response } from "express";
import Product from "../models/product.model";
import { Types } from "mongoose";
import { ReviewType } from "../types/product.type";

// Get product review analytics
export const getProductReviewAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId } = req.params;
    const { dateRange = 7 } = req.query; // days
    
    
    const days = Number(dateRange);
    const currentDate = new Date();
    const currentPeriodStart = new Date(currentDate.getTime() - days * 24 * 60 * 60 * 1000);
    const previousPeriodStart = new Date(currentDate.getTime() - 2 * days * 24 * 60 * 60 * 1000);

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Current period reviews
    const currentReviews = product.reviews.filter(
      (review: ReviewType) => review.createdAt >= currentPeriodStart
    );

    // Previous period reviews
    const previousReviews = product.reviews.filter(
      (review: ReviewType) => review.createdAt >= previousPeriodStart && review.createdAt < currentPeriodStart
    );

    // Calculate metrics
    const currentAvgRating = currentReviews.length > 0 
      ? currentReviews.reduce((sum, r: ReviewType) => sum + r.rating, 0) / currentReviews.length 
      : 0;
    
    const previousAvgRating = previousReviews.length > 0 
      ? previousReviews.reduce((sum, r: ReviewType) => sum + r.rating, 0) / previousReviews.length 
      : 0;

    const ratingChange = previousAvgRating > 0 
      ? ((currentAvgRating - previousAvgRating) / previousAvgRating) * 100 
      : 0;

    const reviewCountChange = previousReviews.length > 0 
      ? ((currentReviews.length - previousReviews.length) / previousReviews.length) * 100 
      : 0;

    // Satisfaction distribution
    const allReviews = product.reviews.filter(
      (review: ReviewType) => review.createdAt >= currentPeriodStart
    );
    
    const distribution = {
      "0-25%": allReviews.filter((r: ReviewType) => r.rating <= 1.25).length,
      "25-50%": allReviews.filter((r: ReviewType) => r.rating > 1.25 && r.rating <= 2.5).length,
      "50-75%": allReviews.filter((r: ReviewType) => r.rating > 2.5 && r.rating <= 3.75).length,
      "75-100%": allReviews.filter((r: ReviewType) => r.rating > 3.75).length,
    };

    const total = allReviews.length;
    const distributionPercentage = {
      "0-25%": total > 0 ? (distribution["0-25%"] / total) * 100 : 0,
      "25-50%": total > 0 ? (distribution["25-50%"] / total) * 100 : 0,
      "50-75%": total > 0 ? (distribution["50-75%"] / total) * 100 : 0,
      "75-100%": total > 0 ? (distribution["75-100%"] / total) * 100 : 0,
    };

    res.json({
      success: true,
      analytics: {
        averageRating: {
          current: Number(currentAvgRating.toFixed(2)),
          change: Number(ratingChange.toFixed(2))
        },
        totalReviews: {
          current: currentReviews.length,
          change: Number(reviewCountChange.toFixed(2))
        },
        satisfactionDistribution: {
          counts: distribution,
          percentages: distributionPercentage
        },
        period: `Last ${days} days`
      }
    });
  } catch (err) {
    next(err);
  }
};

// Get vendor review analytics across all products
export const getVendorReviewAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { vendorId } = req.params;
    const { dateRange = 7 } = req.query;
    
    const days = Number(dateRange);
    const currentDate = new Date();
    const currentPeriodStart = new Date(currentDate.getTime() - days * 24 * 60 * 60 * 1000);
    const previousPeriodStart = new Date(currentDate.getTime() - 2 * days * 24 * 60 * 60 * 1000);

    const analytics = await Product.aggregate([
      { $match: { vendorId: new Types.ObjectId(vendorId) } },
      { $unwind: "$reviews" },
      {
        $facet: {
          currentPeriod: [
            { $match: { "reviews.createdAt": { $gte: currentPeriodStart } } },
            {
              $group: {
                _id: null,
                avgRating: { $avg: "$reviews.rating" },
                totalReviews: { $sum: 1 },
                ratings: { $push: "$reviews.rating" }
              }
            }
          ],
          previousPeriod: [
            { 
              $match: { 
                "reviews.createdAt": { 
                  $gte: previousPeriodStart, 
                  $lt: currentPeriodStart 
                } 
              } 
            },
            {
              $group: {
                _id: null,
                avgRating: { $avg: "$reviews.rating" },
                totalReviews: { $sum: 1 }
              }
            }
          ]
        }
      }
    ]);

    const current = analytics[0].currentPeriod[0] || { avgRating: 0, totalReviews: 0, ratings: [] };
    const previous = analytics[0].previousPeriod[0] || { avgRating: 0, totalReviews: 0 };

    const ratingChange = previous.avgRating > 0 
      ? ((current.avgRating - previous.avgRating) / previous.avgRating) * 100 
      : 0;

    const reviewCountChange = previous.totalReviews > 0 
      ? ((current.totalReviews - previous.totalReviews) / previous.totalReviews) * 100 
      : 0;

    // Distribution calculation
    const ratings = current.ratings || [];
    const distribution = {
      "0-33%": ratings.filter((r: number) => r >= 0 && r <= 1.65).length,
      "34-66%": ratings.filter((r: number) => r > 1.65 && r <= 3.3).length,
      "67-100%": ratings.filter((r: number) => r > 3.3 && r <= 5).length,
    };
    
    const total = ratings.length;
    
    const distributionPercentage = {
      "0-33%": total > 0 ? (distribution["0-33%"] / total) * 100 : 0,
      "34-66%": total > 0 ? (distribution["34-66%"] / total) * 100 : 0,
      "67-100%": total > 0 ? (distribution["67-100%"] / total) * 100 : 0,
    };
    

    res.json({
      success: true,
      analytics: {
        averageRating: {
          current: Number((current.avgRating || 0).toFixed(2)),
          change: Number(ratingChange.toFixed(2))
        },
        totalReviews: {
          current: current.totalReviews,
          change: Number(reviewCountChange.toFixed(2))
        },
        satisfactionDistribution: {
          counts: distribution,
          percentages: distributionPercentage
        },
        period: `Last ${days} days`
      }
    });
  } catch (err) {
    next(err);
  }
};