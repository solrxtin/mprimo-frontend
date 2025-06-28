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
    const now = new Date(); // current end

    // Current period analytics
    const currentMetrics = await Vendor.find({
      _id: new Types.ObjectId(vendorId),
      createdAt: { $gte: currentStart, $lt: now },
    }).select("analytics -_id");

    // Previous period analytics
    const previousMetrics = await Vendor.find({
      _id: new Types.ObjectId(vendorId),
      createdAt: { $gte: previousStart, $lt: currentStart },
    }).select("analytics -_id");
    console.log(currentMetrics);
    console.log(previousMetrics);

    // Extract current + previous values
    const curr = currentMetrics[0]?.analytics || {
      totalRevenue: 0,
      totalSales: 0,
      averageRating: 0,
      productCount: 0,
    };
    const prev = previousMetrics[0]?.analytics || {
      totalRevenue: 0,
      totalSales: 0,
      averageRating: 0,
      productCount: 0,
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

    const startDate = getDateFromRange(range || "7days");
    const product = await Product.findOne({ vendorId });
    let dailySales = [];

    if (product) {
      dailySales = await AnalyticsModel.aggregate([
        {
          $match: {
            entityId: product._id,
            entityType: "product",
            timeframe: "daily",
            date: { $gte: startDate },
          },
        },
        {
          $project: {
            _id: 0,
            date: 1,
            sales: "$metrics.purchases",
            revenue: "$metrics.revenue",
          },
        },
        { $sort: { date: 1 } },
      ]);
    }

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
