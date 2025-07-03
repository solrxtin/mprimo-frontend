import { NextFunction, Request, Response } from "express";
import AnalyticsModel from "../models/analytics.model";
import { Types } from "mongoose";
import Vendor from "../models/vendor.model";
import Product from "../models/product.model";

const getDateFromRange = (range: string): Date => {
  const now = new Date();

  switch (range) {
    case "1day":
      return new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
    case "7days":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "1month":
      return new Date(now.setMonth(now.getMonth() - 1));
    case "6months":
      return new Date(now.setMonth(now.getMonth() - 6));
    default:
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Default to 7 days
  }
};

const getPreviousStartDate = (range: string): Date => {
  const now = new Date();
  switch (range) {
    case "7days":
      return new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000); // 7 days earlier
    case "1month":
      return new Date(now.setMonth(now.getMonth() - 2));
    case "6months":
      return new Date(now.setMonth(now.getMonth() - 12));
    default:
      return new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  }
};

export const getVendorAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const vendorId = req.params.vendorId;
    const range = (req.query.range as string) || "7days";
    const currentStart = getDateFromRange(range);
    const previousStart = getPreviousStartDate(range);
    const now = new Date();

    // Get vendor data
    const vendor = await Vendor.findById(vendorId).select("analytics");
    if (!vendor) {
      return res.status(404).json({ success: false, message: "Vendor not found" });
    }

    // Get current period analytics from products
    const currentMetrics = await AnalyticsModel.aggregate([
      {
        $match: {
          entityType: "product",
          date: { $gte: currentStart, $lt: now }
        }
      },
      {
        $lookup: {
          from: "products",
          localField: "entityId",
          foreignField: "_id",
          as: "product"
        }
      },
      {
        $match: {
          "product.vendorId": new Types.ObjectId(vendorId)
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$metrics.revenue" },
          totalSales: { $sum: "$metrics.purchases" }
        }
      }
    ]);

    // Get previous period analytics
    const previousMetrics = await AnalyticsModel.aggregate([
      {
        $match: {
          entityType: "product",
          date: { $gte: previousStart, $lt: currentStart }
        }
      },
      {
        $lookup: {
          from: "products",
          localField: "entityId",
          foreignField: "_id",
          as: "product"
        }
      },
      {
        $match: {
          "product.vendorId": new Types.ObjectId(vendorId)
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$metrics.revenue" },
          totalSales: { $sum: "$metrics.purchases" }
        }
      }
    ]);

    const productCount = await Product.countDocuments({ vendorId });

    // Extract current + previous values
    const curr = {
      totalRevenue: currentMetrics[0]?.totalRevenue || 0,
      totalSales: currentMetrics[0]?.totalSales || 0,
      averageRating: vendor.analytics?.averageRating || 0,
      productCount: productCount,
    };
    const prev = {
      totalRevenue: previousMetrics[0]?.totalRevenue || 0,
      totalSales: previousMetrics[0]?.totalSales || 0,
      averageRating: vendor.analytics?.averageRating || 0,
      productCount: productCount,
    };

    // Utility to calculate %
    const calcChange = (curr: number, prev: number) => {
      if (prev === 0) return curr === 0 ? 0 : 100;
      return ((curr - prev) / prev) * 100;
    };

    // Calculate percentage changes
    const percentChange = {
      revenue: calcChange(curr.totalRevenue, prev.totalRevenue),
      sales: calcChange(curr.totalSales, prev.totalSales),
      productCount: calcChange(curr.productCount, prev.productCount),
    };

    // Get daily sales for all vendor products
    const dailySales = await AnalyticsModel.aggregate([
      {
        $match: {
          entityType: "product",
          timeframe: "daily",
          date: { $gte: currentStart },
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "entityId",
          foreignField: "_id",
          as: "product"
        }
      },
      {
        $match: {
          "product.vendorId": new Types.ObjectId(vendorId)
        }
      },
      {
        $group: {
          _id: "$date",
          sales: { $sum: "$metrics.purchases" },
          revenue: { $sum: "$metrics.revenue" },
        }
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          sales: 1,
          revenue: 1,
        },
      },
      { $sort: { date: 1 } },
    ]);

    res.status(200).json({
      success: true,
      message: `Vendor analytics for ${range}`,
      range,
      currentData: curr,
      change: percentChange,
      dailySales,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};