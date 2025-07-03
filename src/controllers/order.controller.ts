import { NextFunction, Request, Response } from "express";
import User from "../models/user.model";
import { generateTrackingNumber } from "../utils/generateTrackingNumber";
import Order, { Refund } from "../models/order.model";
import Notification from "../models/notification.model";
import Product from "../models/product.model";
import { redisService, socketService } from "..";
import { ItemType } from "../types/order.type";
import mongoose from "mongoose";
import AuditLogService from "../services/audit-log.service";
import { Types } from "mongoose";
import { OrderService } from "../services/order.service";
import { strictRateLimit } from "../middlewares/enhanced-rate-limit.middleware";

const generateEstimatedDelivery = (daysAhead: number = 7): Date => {
  const estimatedDate = new Date();
  estimatedDate.setDate(estimatedDate.getDate() + daysAhead);
  return estimatedDate;
};

export const makeOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id: productId, vendorId } = req.params;
  const { items, paymentMethod, totalAmount, address } = req.body;
  const userId = req.userId;

  try {
    const lockAcquired = await redisService.acquireLock(productId, vendorId);
    if (!lockAcquired) {
      return res
        .status(429)
        .json({ success: false, message: "Duplicate order in progress" });
    }

    if (!items || !paymentMethod || !totalAmount) {
      res
        .status(400)
        .json({ message: "Missing required fields", success: false });
      return;
    }

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({
        success: false,
        message: "Order must include at least one item",
      });
      return;
    }

    const user = await User.findById(userId);

    if (user?.addresses?.length === 0) {
      res
        .status(400)
        .json({ success: false, message: "Add a shipping address to proceed" });
      return;
    }

    const userAddress =
      address || user?.addresses?.find((address) => address.isDefault);
    const trackingNumber = generateTrackingNumber();
    const estimatedDelivery = generateEstimatedDelivery();

    const orderInfo = {
      userId,
      items,
      payment: {
        method: paymentMethod,
        amount: totalAmount,
        currency: user?.preferences?.currency,
      },
      shipping: {
        address: userAddress,
        carrier: "fedex",
        trackingNumber,
        estimatedDelivery,
      },
      totalAmount,
      trackingNumber,
      address: userAddress,
    };

    // Save Order
    const order = await Order.create(orderInfo);

    await Promise.all(
      items.flatMap((item1, i) =>
        items
          .slice(i + 1)
          .map(
            (item2) =>
              item1 !== item2 && redisService.trackRelatedPurchase(item1, item2)
          )
      )
    );

    // Notify User
    await Notification.create({
      userId,
      case: "order-created",
      title: "New Order Created",
      message: `Your order has been placed successfully. Order ID: ${order._id}`,
      type: "order",
      data: { redirectUrl: "/", entityId: order._id, entityType: "order" }, // work on the redirectUrl
      read: false,
    });

    socketService.notifyUserForOrder(userId, {
      event: "orderCreated",
      message: "Your order has been placed",
      order,
    });

    // Notify vendors concurrently
    await Promise.all(
      items.map(async (item: ItemType) => {
        await redisService.trackEvent(
          item.productId.toString(),
          "purchase",
          userId,
          item.price * item.quantity
        );

        const product = await Product.findById(item.productId)
          .populate({
            path: "vendorId name",
            select: "userId _id",
            // populate: {
            //   path: "userId",
            //   select: "_id",
            // },
          })
          .select("vendorId");

        if (!product) return;

        const vendorId = product.vendorId._id;
        const vendorUserId = (product.vendorId as any).userId;

        // Create notification
        const notification = await Notification.create({
          userId: vendorUserId,
          message: `Order ${order._id} for ${product.name}`,
          title: "New Order Received",
          type: "order",
          case: "new-order",
          data: {
            redirectUrl: `/vendor/orders/${order._id}`,
            entityId: order._id,
            entityType: "order",
          },
          read: false,
        });

        // Send socket notification
        socketService.notifyVendor(vendorId, {
          event: "saleActivity",
          notification,
        });
      })
    );

    await AuditLogService.log(
      "ORDER_CREATED",
      "order",
      "info",
      {
        orderId: order._id,
        userId,
        totalAmount: order.payment.amount,
        itemCount: order.items.length,
        paymentMethod: order.payment?.method,
      },
      req,
      (order._id as Types.ObjectId).toString()
    );

    res.status(201).json({ message: "Order created successfully", order });
  } catch (error) {
    let errorMessage = "Unknown error";

    if (error instanceof Error) {
      errorMessage = error.message;
    }

    await AuditLogService.log(
      "ORDER_CREATION_ERROR",
      "order",
      "error",
      { error: errorMessage, userId: req.userId },
      req
    );
    next(error);
  } finally {
    await redisService.releaseLock(productId, vendorId);
  }
};

export const getUserOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId!.toString();
    const { page = 1, limit = 10, status } = req.query;

    const orders = await OrderService.getOrdersByUser(
      userId,
      Number(page),
      Number(limit),
      status as string
    );

    res.json({
      success: true,
      ...orders
    });
  } catch (error) {
    next(error);
  }
};

export const getAllOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const orders = await Order.find({})
      .sort({ createdAt: -1 })
      .populate({
        path: "items.productId",
        select: "-__v",
        populate: {
          path: "vendorId",
        },
      })
      .populate({
        path: "userId",
        select: "profile email",
      });

    res.status(200).json({
      orders,
      message: "All orders fetched successfully",
      success: true,
    });
  } catch (error) {
    next(error);
  }
};

export const getVendorOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.params.vendorId) {
      res.status(400).json({
        success: false,
        message: "Vendor ID is required",
      });
      return;
    }
    const vendorId = new mongoose.Types.ObjectId(req.params.vendorId);

    const orders = await Order.aggregate([
      {
        $lookup: {
          from: "products",
          localField: "items.productId",
          foreignField: "_id",
          as: "productDocs",
        },
      },
      {
        $unwind: "$items",
      },
      {
        $lookup: {
          from: "products",
          localField: "items.productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $unwind: "$productDetails",
      },
      {
        $match: {
          "productDetails.vendorId": new mongoose.Types.ObjectId(vendorId),
        },
      },
      {
        $group: {
          _id: "$_id",
          userId: { $first: "$userId" },
          payment: { $first: "$payment" },
          shipping: { $first: "$shipping" },
          status: { $first: "$status" },
          createdAt: { $first: "$createdAt" },
          items: {
            $push: {
              productId: "$items.productId",
              quantity: "$items.quantity",
              price: "$items.price",
              product: {
                name: "$productDetails.name",
                image: "$productDetails.image",
                vendorId: "$productDetails.vendorId",
              },
            },
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $project: {
          _id: 1,
          status: 1,
          createdAt: 1,
          payment: 1,
          shipping: 1,
          items: 1,
          user: {
            _id: "$user._id",
            profile: "$user.profile",
            email: "$user.email",
          },
        },
      },
    ]);
    return res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      orders,
    });
  } catch (err) {
    next(err);
  }
};

export const getOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orderId } = req.params;
    const userId = req.userId!.toString();

    const order = await OrderService.getOrderById(orderId, userId);

    res.json({
      success: true,
      order
    });
  } catch (error) {
    next(error);
  }
};

export const changeShippingAddress = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const orderId = req.params.id;
  const { address } = req.body;

  try {
    const order = await Order.findById(orderId);

    if (!order) {
      res.status(404).json({
        success: false,
        message: "Order not found",
      });
      return;
    }

    const modifiedAddress = {
      street: address.street,
      city: address.city,
      state: address.state,
      country: address.country,
      postalCode: address.postalCode,
    };

    order.shipping.address = modifiedAddress;
    await order.save();

    res.status(200).json({
      order,
      message: "Shipping address updated successfully",
      success: true,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    const order = await OrderService.cancelOrder(orderId, reason);

    // Log order cancellation
    await AuditLogService.log(
      'ORDER_CANCELLED',
      'order',
      'warning',
      {
        orderId,
        userId: req.userId,
        reason,
        totalAmount: order.payment.amount
      },
      req,
      orderId
    );

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order,
    });
  } catch (error) {
    let errorMessage = "Unknown error";

    if (error instanceof Error) {
      errorMessage = error.message;
    }
    await AuditLogService.log(
      'ORDER_CANCELLATION_ERROR',
      'order',
      'error',
      { 
        error: errorMessage, 
        orderId: req.params.id,
        userId: req.userId 
      },
      req
    );
    next(error);
  }
};

export const refundOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params;
    const { amount, reason } = req.body;
    const userId = req.userId!.toString();

    const refund = await OrderService.processRefund(orderId, amount, reason, userId);

    // Log refund processing
    await AuditLogService.log(
      'ORDER_REFUND_PROCESSED',
      'order',
      'warning',
      {
        orderId,
        refundAmount: amount,
        reason,
        processedBy: userId,
        refundId: refund._id
      },
      req,
      orderId
    );

    res.json({
      success: true,
      message: 'Refund processed successfully',
      refund
    });
  } catch (error) {
    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    await AuditLogService.log(
      'ORDER_REFUND_ERROR',
      'order',
      'error',
      { 
        error: errorMessage, 
        orderId: req.params.id,
        userId: req.userId 
      },
      req
    );
    next(error);
  }
}

export const getRefunds = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refunds = await Refund.find({}).sort({ createdAt: -1 }).populate('orderId');

    res.json({
      success: true,
      refunds
    });
  } catch (error) {
    next(error);
  }
}

export const getOrderStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = 1, limit = 20, status, startDate, endDate } = req.query;
    const orders = await OrderService.getAllOrders(
      Number(page),
      Number(limit),
      {
        status: status as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined
      }
    );

    res.json({
      success: true,
      ...orders
    });
  } catch(error) {
    next(error)
  }
}

const updateOrderStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orderId } = req.params;
    const { status, trackingNumber, carrier, shippingStatus } = req.body;
    const userId = req.userId!.toString();

    const originalOrder = await OrderService.getOrderById(orderId);
    const updatedOrder = await OrderService.updateOrderStatus(
      orderId,
      status,
      shippingStatus,
      {trackingNumber, carrier}
    );

    await AuditLogService.log(
      "ORDER_STATUS_UPDATED",
      "order",
      "info",
      {
        orderId,
        previousStatus: originalOrder.status,
        newStatus: status,
        updatedBy: userId,
        trackingNumber,
        carrier,
      },
      req,
      orderId
    );

    // if (originalOrder.userId) {
    //   await pushNotificationService.notifyOrderStatusUpdate(
    //     originalOrder.userId.toString(),
    //     orderStatus,
    //     status
    //   );
    // }

    res.json({ success: true, order: updatedOrder });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    await AuditLogService.log(
      "ORDER_STATUS_UPDATE_ERROR",
      "order",
      "error",
      {
        error: errorMessage,
        orderId: req.params.id,
        userId: req.userId,
      },
      req
    );
    next(error);
  }
};

export const OrderController = {
  updateOrderStatus: [strictRateLimit, updateOrderStatus],
};


