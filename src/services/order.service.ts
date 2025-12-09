// src/services/order.service.ts
import Order, { Refund } from "../models/order.model";
import Product from "../models/product.model";
import createError from "http-errors";
import mongoose from "mongoose";

export class OrderService {
  static async updateOrderStatus(
    orderId: string,
    status?:
      | "pending"
      | "processing"
      | "partially_shipped"
      | "shipped"
      | "delivered"
      | "cancelled",
    shipmentId?: string,
    shipmentStatus?: "pending" | "processing" | "picked_up" | "in_transit" | "out_for_delivery" | "delivered" | "failed",
    options?: { trackingNumber?: string; carrier?: string; waybill?: string }
  ) {
    const order = await Order.findById(orderId);

    if (!order) {
      throw createError(404, "Order not found");
    }

    // Update overall order status
    if (status) order.status = status;

    // Update specific shipment status
    if (shipmentId && shipmentStatus) {
      const shipmentIndex = order.shipments.findIndex(
        (s: any) => s._id.toString() === shipmentId
      );
      
      if (shipmentIndex !== -1) {
        order.shipments[shipmentIndex].shipping.status = shipmentStatus;
        
        if (options?.trackingNumber) {
          order.shipments[shipmentIndex].shipping.trackingNumber = options.trackingNumber;
        }
        if (options?.carrier) {
          order.shipments[shipmentIndex].shipping.carrier = options.carrier;
        }
        if (options?.waybill) {
          order.shipments[shipmentIndex].shipping.waybill = options.waybill;
        }

        // Auto-update overall order status based on shipment statuses
        const allShipments = order.shipments;
        const deliveredCount = allShipments.filter((s: any) => s.shipping.status === 'delivered').length;
        const shippedCount = allShipments.filter((s: any) => ['picked_up', 'in_transit', 'out_for_delivery'].includes(s.shipping.status)).length;
        
        if (deliveredCount === allShipments.length) {
          order.status = 'delivered';
        } else if (deliveredCount > 0 || shippedCount > 0) {
          order.status = 'partially_shipped';
        }
      }
    }

    await order.save();

    return order.populate([
      {
        path: "items.productId",
        select: "name images",
      },
      {
        path: "userId",
        select: "profile email",
      },
      {
        path: "shipments.vendorId",
        select: "businessInfo.name",
      },
    ]);
  }

  static async cancelOrder(orderId: string, reason?: string) {
    const order = await Order.findById(orderId).populate({
      path: "paymentId",
      select: "userId amount currency method status",
    });

    if (!order) {
      throw createError(404, "Order not found");
    }

    // Check if order can be cancelled
    if (order.status === "delivered" || order.status === "cancelled") {
      throw createError(400, "Order cannot be cancelled");
    }

    order.status = "cancelled";
    order.cancellationReason = reason;
    order.cancelledAt = new Date();

    await order.save();

    return order.populate([
      {
        path: "items.productId",
        select: "name images",
      },
    ]);
  }

  static async processRefund(
    orderId: string,
    amount: number,
    reason: string,
    processedBy: string
  ) {
    const order = await Order.findById(orderId);

    if (!order) {
      throw createError(404, "Order not found");
    }

    if (order.status !== "delivered" && order.status !== "cancelled") {
      throw createError(
        400,
        "Order must be delivered or cancelled to process refund"
      );
    }

    // Create refund record (you might have a separate Refund model)
    const refund = {
      _id: new mongoose.Types.ObjectId(),
      orderId: order._id,
      amount,
      reason,
      processedBy: new mongoose.Types.ObjectId(processedBy),
      processedAt: new Date(),
      status: "processed",
    };

    // Update order with refund info
    await Refund.create(refund);
    order.status = "refunded";

    await order.save();

    return refund;
  }

  static async getOrderStatistics() {
    const [
      totalOrders,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue,
      monthlyStats,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: "pending" }),
      Order.countDocuments({ status: "processing" }),
      Order.countDocuments({ status: "shipped" }),
      Order.countDocuments({ status: "delivered" }),
      Order.countDocuments({ status: "cancelled" }),
      Order.aggregate([
        { $match: { status: { $in: ["delivered", "processing"] } } },
        { $group: { _id: null, total: { $sum: "$payment.amount" } } },
      ]),
      Order.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
              day: { $dayOfMonth: "$createdAt" },
            },
            count: { $sum: 1 },
            revenue: { $sum: "$payment.amount" },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
      ]),
    ]);

    return {
      totalOrders,
      ordersByStatus: {
        pending: pendingOrders,
        processing: processingOrders,
        shipped: shippedOrders,
        delivered: deliveredOrders,
        cancelled: cancelledOrders,
      },
      totalRevenue: totalRevenue[0]?.total || 0,
      monthlyStats,
      conversionRate:
        totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : 0,
    };
  }

  static async getOrdersByUser(
    userId: string,
    page = 1,
    limit = 10,
    status?: string
  ) {
    const skip = (page - 1) * limit;
    const query: any = { userId: new mongoose.Types.ObjectId(userId) };

    if (status) {
      query.status = status;
    }

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate({
          path: "items.productId",
          select: "name images inventory reviews ratings vendorId",
          populate: {
            path: "vendorId",
            select: "businessInfo.name accountType ratings.average",
          },
        })
        .populate({
          path: "receivedItems.productId",
          select: "name images inventory reviews ratings vendorId",
          populate: {
            path: "vendorId",
            select: "businessInfo.name accountType ratings.average",
          },
        })
        .populate({
          path: "rejectedItems.productId",
          select: "name images inventory reviews ratings vendorId",
          populate: {
            path: "vendorId",
            select: "businessInfo.name accountType ratings.average",
          },
        })
        .populate({
          path: "paymentId",
          select: "amount status currency method transactionId",
        })
        .populate({
          path: "userId",
          select: "profile",
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(query),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  static async getOrderById(orderId: string, userId?: string) {
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      throw createError(400, "Invalid order ID format");
    }

    const order = await Order.findById(orderId)
      .populate({
        path: "items.productId",
        select: "name images inventory vendorId",
        populate: {
          path: "vendorId",
          select: "businessInfo.name accountType",
        },
      })
      .populate({
        path: "shipments.vendorId",
        select: "businessInfo",
      })
      .populate({
        path: "shipments.items.productId",
        select: "name images",
      })
      .populate({
        path: "userId",
        select: "profile email",
      })
      .populate({
        path: "paymentId",
        select: "amount currency status method",
      });

    if (!order) {
      throw createError(404, "Order not found");
    }

    return order;
  }

  static async getAllOrders(
    page = 1,
    limit = 20,
    filters: {
      status?: string;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ) {
    const skip = (page - 1) * limit;
    const query: any = {};

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = filters.startDate;
      if (filters.endDate) query.createdAt.$lte = filters.endDate;
    }

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate({
          path: "items.productId",
          select: "name images vendorId",
          populate: {
            path: "vendorId",
            select: "businessInfo.name",
          },
        })
        .populate({
          path: "userId",
          select: "profile email",
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(query),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  static async createOrder(orderData: any) {
    const order = await Order.create(orderData);

    return order.populate([
      {
        path: "items.productId",
        select: "name images",
      },
      {
        path: "userId",
        select: "profile email",
      },
    ]);
  }

  static async updateShipmentStatus(
    orderId: string,
    shipmentId: string,
    status: "pending" | "processing" | "picked_up" | "in_transit" | "out_for_delivery" | "delivered" | "failed",
    trackingData?: {
      trackingNumber?: string;
      waybill?: string;
      actualPickup?: Date;
      actualDelivery?: Date;
    }
  ) {
    const order = await Order.findById(orderId);
    
    if (!order) {
      throw createError(404, "Order not found");
    }

    const shipmentIndex = order.shipments.findIndex(
      (s: any) => s._id.toString() === shipmentId
    );

    if (shipmentIndex === -1) {
      throw createError(404, "Shipment not found");
    }

    // Update shipment
    order.shipments[shipmentIndex].shipping.status = status;
    
    if (trackingData) {
      if (trackingData.trackingNumber) {
        order.shipments[shipmentIndex].shipping.trackingNumber = trackingData.trackingNumber;
      }
      if (trackingData.waybill) {
        order.shipments[shipmentIndex].shipping.waybill = trackingData.waybill;
      }
      if (trackingData.actualPickup) {
        order.shipments[shipmentIndex].shipping.actualPickup = trackingData.actualPickup;
      }
      if (trackingData.actualDelivery) {
        order.shipments[shipmentIndex].shipping.actualDelivery = trackingData.actualDelivery;
      }
    }

    // Update overall order status
    const allShipments = order.shipments;
    const deliveredCount = allShipments.filter((s: any) => s.shipping.status === 'delivered').length;
    const shippedCount = allShipments.filter((s: any) => ['picked_up', 'in_transit', 'out_for_delivery'].includes(s.shipping.status)).length;
    
    if (deliveredCount === allShipments.length) {
      order.status = 'delivered';
    } else if (deliveredCount > 0 || shippedCount > 0) {
      order.status = 'partially_shipped';
    }

    await order.save();
    return order;
  }

  static async getOrderShipments(orderId: string) {
    const order = await Order.findById(orderId)
      .populate({
        path: "shipments.vendorId",
        select: "businessInfo",
      })
      .populate({
        path: "shipments.items.productId",
        select: "name images",
      });

    if (!order) {
      throw createError(404, "Order not found");
    }

    return {
      orderId: order._id,
      shipments: order.shipments,
      deliveryCoordination: order.deliveryCoordination,
      status: order.status
    };
  }
}
