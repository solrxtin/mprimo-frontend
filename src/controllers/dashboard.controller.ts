import { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";
import Product from "../models/product.model";
import Order from "../models/order.model";
import { ICountry } from "../models/country.model";

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
    case "1year":
      return new Date(now.setFullYear(now.getFullYear() - 1));
    default:
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
};

const getPreviousStartDate = (range: string): Date => {
  const now = new Date();
  switch (range) {
    case "1month":
      return new Date(now.setMonth(now.getMonth() - 2));
    default:
      return new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  }
};

export const getVendorDashboard = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const vendorId = req.params.vendorId;
    const range = (req.query.range as string) || "7days";
    const currentStart = getDateFromRange(range);
    const previousStart = getPreviousStartDate(range);
    const currentMonthStart = getDateFromRange("1month");
    const previousMonthStart = getPreviousStartDate("1month");
    const now = new Date();

    const vendorProducts = await Product.find({ vendorId }).populate(
      "country",
      "currency"
    );
    if (!vendorProducts || vendorProducts.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Products not found" });
    }

    const productIds = vendorProducts.map((p) => p._id);
    const currency =
      (vendorProducts[0]?.country as ICountry)?.currency || "USD";

    // Current month vs previous month comparison
    const [currentOrdersMonth, previousOrdersMonth] = await Promise.all([
      Order.aggregate([
        {
          $match: {
            "items.productId": { $in: productIds },
            "payment.status": "completed",
            createdAt: { $gte: currentMonthStart, $lt: now },
          },
        },
        { $unwind: "$items" },
        { $match: { "items.productId": { $in: productIds } } },
        {
          $group: {
            _id: null,
            totalRevenue: {
              $sum: { $multiply: ["$items.price", "$items.quantity"] },
            },
            totalOrders: { $addToSet: "$_id" },
            totalSales: { $sum: "$items.quantity" },
          },
        },
        {
          $project: {
            totalRevenue: 1,
            totalOrders: { $size: "$totalOrders" },
            totalSales: 1,
          },
        },
      ]),
      Order.aggregate([
        {
          $match: {
            "items.productId": { $in: productIds },
            "payment.status": "completed",
            createdAt: { $gte: previousMonthStart, $lt: currentMonthStart },
          },
        },
        { $unwind: "$items" },
        { $match: { "items.productId": { $in: productIds } } },
        {
          $group: {
            _id: null,
            totalRevenue: {
              $sum: { $multiply: ["$items.price", "$items.quantity"] },
            },
            totalOrders: { $addToSet: "$_id" },
            totalSales: { $sum: "$items.quantity" },
          },
        },
        {
          $project: {
            totalRevenue: 1,
            totalOrders: { $size: "$totalOrders" },
            totalSales: 1,
          },
        },
      ]),
    ]);

    const currMonth = currentOrdersMonth[0] || {
      totalRevenue: 0,
      totalOrders: 0,
      totalSales: 0,
    };
    const prevMonth = previousOrdersMonth[0] || {
      totalRevenue: 0,
      totalOrders: 0,
      totalSales: 0,
    };

    // Lifetime totals
    const [lifetimeData] = await Order.aggregate([
      {
        $match: {
          "items.productId": { $in: productIds },
          "payment.status": "completed",
        },
      },
      { $unwind: "$items" },
      { $match: { "items.productId": { $in: productIds } } },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: { $multiply: ["$items.price", "$items.quantity"] },
          },
          totalOrders: { $addToSet: "$_id" },
          totalSales: { $sum: "$items.quantity" },
        },
      },
      {
        $project: {
          totalRevenue: 1,
          totalOrders: { $size: "$totalOrders" },
          totalSales: 1,
        },
      },
    ]);

    // Analytics: current range
    const [analyticsData] = await Order.aggregate([
      {
        $match: {
          "items.productId": { $in: productIds },
          "payment.status": "completed",
          createdAt: { $gte: currentStart, $lt: now },
        },
      },
      { $unwind: "$items" },
      { $match: { "items.productId": { $in: productIds } } },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: { $multiply: ["$items.price", "$items.quantity"] },
          },
          totalOrders: { $addToSet: "$_id" },
          totalSales: { $sum: "$items.quantity" },
        },
      },
      {
        $project: {
          totalRevenue: 1,
          totalOrders: { $size: "$totalOrders" },
          totalSales: 1,
        },
      },
    ]);

    // Daily chart for last 7 days
    const dailySalesData = await Order.aggregate([
      {
        $match: {
          "items.productId": { $in: productIds },
          "payment.status": "completed",
          createdAt: {
            $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      },
      { $unwind: "$items" },
      { $match: { "items.productId": { $in: productIds } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          sales: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
          orders: { $addToSet: "$_id" },
        },
      },
      {
        $project: {
          date: "$_id",
          sales: 1,
          orders: { $size: "$orders" },
        },
      },
      { $sort: { date: 1 } },
    ]);

    // Format last 7 days chart
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split("T")[0];
      const dayName = date.toLocaleDateString("en-US", { weekday: "long" });

      const dayData = dailySalesData.find((d) => d.date === dateStr);
      return {
        day: dayName,
        date: dateStr,
        sales: dayData?.sales || 0,
        orders: dayData?.orders || 0,
      };
    });

    const periodDays = Math.max(
      1,
      Math.ceil(
        (now.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24)
      )
    );

    // Helpers
    const calcPercentChange = (curr: number, prev: number) => {
      if (prev === 0) return curr === 0 ? 0 : 100;
      return ((curr - prev) / prev) * 100;
    };
    const calcAbsoluteChange = (curr: number, prev: number) => curr - prev;

    res.json({
      success: true,
      dashboard: {
        salesTotal: {
          value: lifetimeData?.totalRevenue || 0,
          previousValue: prevMonth.totalRevenue || 0,
          changeAmount: calcAbsoluteChange(
            currMonth.totalRevenue,
            prevMonth.totalRevenue
          ),
          changePercent: calcPercentChange(
            currMonth.totalRevenue,
            prevMonth.totalRevenue
          ),
          currency,
        },
        totalOrders: {
          value: lifetimeData?.totalOrders || 0,
          previousValue: prevMonth.totalOrders || 0,
          changeAmount: calcAbsoluteChange(
            currMonth.totalOrders,
            prevMonth.totalOrders
          ),
          changePercent: calcPercentChange(
            currMonth.totalOrders,
            prevMonth.totalOrders
          ),
        },
        totalProducts: {
          value: vendorProducts.length,
        },
      },
      analytics: {
        totalSales: analyticsData?.totalRevenue || 0,
        totalOrders: analyticsData?.totalOrders || 0,
        averageOrdersPerDay: parseFloat(
          ((analyticsData?.totalOrders || 0) / periodDays).toFixed(2)
        ),
        currency,
      },
      salesOverview: last7Days,
      currency,
    });
  } catch (error) {
    next(error);
  }
};
