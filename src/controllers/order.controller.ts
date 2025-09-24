import { NextFunction, Request, Response } from "express";
import User from "../models/user.model";
import { generateTrackingNumber } from "../utils/generateTrackingNumber";
import Order, { Refund } from "../models/order.model";
import Notification from "../models/notification.model";
import Product from "../models/product.model";
import { redisService, socketService } from "..";
import mongoose from "mongoose";
import AuditLogService from "../services/audit-log.service";
import { Types } from "mongoose";
import { OrderService } from "../services/order.service";
import { strictRateLimit } from "../middlewares/enhanced-rate-limit.middleware";
import { StripeService } from "../services/stripe.service";
import { CryptoPaymentService } from "../services/crypto-payment.service";
import Payment, { VendorPayment } from "../models/payment.model";
import { IPayment } from "../types/payment.type";

const cryptoService = new CryptoPaymentService();

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
  const { validatedItems, pricing, paymentData, address } = req.body;
  const userId = req.userId;
  let lockKey = "";
  let currency: any = "";
  let order: any = null;

  if (paymentData.type === "crypto") {
    currency = paymentData.token;
  } else if (paymentData.type === "stripe") {
    currency = pricing.currency;
  }

  try {
    // Validate required fields
    if (
      !validatedItems ||
      validatedItems.length === 0 ||
      !pricing ||
      !address
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required data" });
    }

    // Create comprehensive lock key
    lockKey = `order:${userId}:${validatedItems
      .map((i: any) => i.variantId)
      .sort()
      .join(",")}`;
    const lockAcquired = await redisService.acquireLock(
      lockKey,
      userId.toString()
    );
    if (!lockAcquired) {
      return res.status(429).json({
        success: false,
        message: "Order already in progress",
      });
    }

    const user = await User.findById(userId);

    if (user?.addresses?.length === 0) {
      res
        .status(400)
        .json({ success: false, message: "Add a shipping address to proceed" });
      return;
    }

    const userAddress =
      address || user?.addresses?.find((addr) => addr.isDefault);
    if (!userAddress) {
      return res.status(400).json({
        success: false,
        message: "Shipping address required",
      });
    }

    const shipping = {
      address: userAddress,
      carrier: "fedex",
      trackingNumber: generateTrackingNumber(),
      status: "pending",
      estimatedDelivery: generateEstimatedDelivery(),
    };

    // Process payment first
    if (paymentData.type === "stripe" && paymentData.paymentIntentId) {
      // Verify Stripe payment using StripeService
      const intent = await StripeService.retrievePaymentIntent(
        paymentData.paymentIntentId
      );
      if (intent.status !== "succeeded") {
        return res.status(400).json({
          success: false,
          message: "Payment not successful",
        });
      }

      let payment = await Payment.findOne({ transactionId: intent.id });

      if (!payment) {
        payment = await Payment.create({
          userId,
          amount: pricing.total,
          currency,
          method: "stripe",
          status: "pending",
          transactionId: paymentData.paymentIntentId,
          gateway: "stripe",
        });
      }

      order = await Order.create({
        userId,
        paymentId: payment._id,
        shipping,
        items: validatedItems,
        status: "processing",
      });
    } else if (paymentData.type === "crypto") {
      // Get user's crypto wallet
      const userWallet = await cryptoService.getWalletByUserId(userId);
      if (!userWallet) {
        return res.status(400).json({
          success: false,
          message: "Crypto wallet not found",
        });
      }

      // Check user balance
      const balance = await cryptoService.getBalance(
        userWallet.address,
        paymentData.tokenType.toLowerCase() as "usdc" | "usdt"
      );
      if (parseFloat(balance) < paymentData.amount) {
        return res.status(400).json({
          success: false,
          message: `Insufficient ${paymentData.tokenType} balance. Required: ${paymentData.amount}, Available: ${balance}`,
        });
      }

      let paymentRecord = await Payment.create({
        userId,
        amount: pricing.total,
        currency,
        method: "crypto",
        status: "pending",
        transactionId: `crypto-${Date.now()}`,
        gateway: "crypto",
      });

      order = await Order.create({
        userId,
        paymentId: paymentRecord._id,
        shipping,
        items: validatedItems,
        status: "processing",
      });

      // Get vendor wallet for each item and transfer payment
      await Promise.all(
        validatedItems.map(async (item: any) => {
          const product = await Product.findById(item.productId).populate({
            path: "vendorId",
            populate: { path: "userId", select: "_id" },
          });

          if (!product || !product.vendorId) return null;

          const vendorUserId = (product.vendorId as any).userId;
          const vendorWallet = await cryptoService.getWalletByUserId(
            vendorUserId
          );

          if (!vendorWallet) return null;

          const itemTotal = item.price * item.quantity;

          const transfer = await cryptoService.signTransaction(
            userId,
            vendorWallet.address,
            itemTotal.toString(),
            paymentData.tokenType.toUpperCase() as "USDC" | "USDT"
          );

          // Create VendorPayment record
          await VendorPayment.create({
            vendorId: (product.vendorId as any)._id,
            orderId: order._id,
            tokenType: transfer.tokenType,
            amount: transfer.amount,
            transactionHash: transfer.transactionHash,
            method: "crypto",
            status: "completed",
          });

          console.log(`Transaction hash: ${transfer.transactionHash}`);
        })
      );

      paymentRecord.status = "completed";
      await paymentRecord.save();
    }

    // Track related purchases
    await Promise.all(
      validatedItems.flatMap((item1: any, i: number) =>
        validatedItems
          .slice(i + 1)
          .map((item2: any) =>
            redisService.trackRelatedPurchase(item1.productId, item2.productId)
          )
      )
    );

    // Update inventory
    await Promise.all(
      validatedItems.map(async (item: any) => {
        await Product.findOneAndUpdate(
          { _id: item.productId, "variants.options.sku": item.variantId },
          { $inc: { "variants.$.options.$.quantity": -item.quantity } }
        );
      })
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

    // Group items by vendor and notify
    const vendorGroups = new Map();
    for (const item of validatedItems) {
      const product = await Product.findById(item.productId).populate({
        path: "vendorId",
        populate: { path: "userId", select: "_id" },
      });

      if (product) {
        const vendorId = (product.vendorId as any)._id.toString();
        if (!vendorGroups.has(vendorId)) {
          vendorGroups.set(vendorId, {
            vendorUserId: (product.vendorId as any).userId,
            items: [],
          });
        }
        vendorGroups
          .get(vendorId)
          .items.push({ ...item, productName: product.name });
      }
    }

    // Notify each vendor
    await Promise.all(
      Array.from(vendorGroups.entries()).map(
        async ([vendorId, { vendorUserId, items }]) => {
          // Track events
          await Promise.all(
            items.map((item: any) =>
              redisService.trackEvent(
                item.productId,
                "purchase",
                userId,
                item.price * item.quantity
              )
            )
          );

          // Create notification
          const notification = await Notification.create({
            userId: vendorUserId,
            message: `New order ${order._id} with ${items.length} items`,
            title: "New Order Received",
            type: "order",
            case: "new-order",
            data: {
              redirectUrl: `/vendor/orders/${order._id}`,
              entityId: order._id,
              entityType: "order",
            },
          });

          // Send socket notification
          socketService.notifyVendor(vendorId, {
            event: "saleActivity",
            notification,
          });
        }
      )
    );

    if (paymentData.type === "stripe") {
      await Promise.all(
        validatedItems.map(async (item: any) => {
          const product = await Product.findById(item.productId).populate({
            path: "vendorId",
            populate: { path: "userId", select: "_id" },
          });

          if (!product || !product.vendorId) return null;

          const itemTotal = item.price * item.quantity;
          // Create VendorPayment record
          await VendorPayment.create({
            vendorId: (product.vendorId as any)._id,
            orderId: order._id,
            tokenType: currency,
            amount: paymentData.amount,
            transactionHash: paymentData.paymentIntentId,
            method: "stripe",
            status: "completed",
          });
        })
      );
    }

    await AuditLogService.log(
      "ORDER_CREATED",
      "order",
      "info",
      {
        orderId: order._id,
        userId,
        totalAmount: paymentData.amount,
        itemCount: order.items.length,
        paymentMethod: paymentData.paymentMethod,
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
    await redisService.releaseLock(lockKey, userId.toString());
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
    const order = await OrderService.getOrderById(orderId);

    res.json({
      success: true,
      order,
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
      "ORDER_CANCELLED",
      "order",
      "warning",
      {
        orderId,
        userId: req.userId,
        reason,
        totalAmount: (order.paymentId as IPayment)?.amount ?? 0,
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
      "ORDER_CANCELLATION_ERROR",
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

export const refundOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orderId } = req.params;
    const { amount, reason } = req.body;
    const userId = req.userId!.toString();

    const refund = await OrderService.processRefund(
      orderId,
      amount,
      reason,
      userId
    );

    // Log refund processing
    await AuditLogService.log(
      "ORDER_REFUND_PROCESSED",
      "order",
      "warning",
      {
        orderId,
        refundAmount: amount,
        reason,
        processedBy: userId,
        refundId: refund._id,
      },
      req,
      orderId
    );

    res.json({
      success: true,
      message: "Refund processed successfully",
      refund,
    });
  } catch (error) {
    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    await AuditLogService.log(
      "ORDER_REFUND_ERROR",
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

export const getRefunds = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const refunds = await Refund.find({})
      .sort({ createdAt: -1 })
      .populate("orderId");

    res.json({
      success: true,
      refunds,
    });
  } catch (error) {
    next(error);
  }
};

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
        endDate: endDate ? new Date(endDate as string) : undefined,
      }
    );

    res.json({
      success: true,
      ...orders,
    });
  } catch (error) {
    next(error);
  }
};

export const getVendorOrderMetrics = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { vendorId } = req.params;
    const { dateRange = 7 } = req.query;

    const days = Number(dateRange);
    const currentDate = new Date();
    const currentPeriodStart = new Date(
      currentDate.getTime() - days * 24 * 60 * 60 * 1000
    );
    const previousPeriodStart = new Date(
      currentDate.getTime() - 2 * days * 24 * 60 * 60 * 1000
    );

    const metrics = await Order.aggregate([
      {
        $lookup: {
          from: "products",
          localField: "items.productId",
          foreignField: "_id",
          as: "productDocs",
        },
      },
      {
        $match: {
          "productDocs.vendorId": new Types.ObjectId(vendorId),
        },
      },
      {
        $facet: {
          currentPeriod: [
            { $match: { createdAt: { $gte: currentPeriodStart } } },
            {
              $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                successfulOrders: {
                  $sum: {
                    $cond: [
                      { $in: ["$status", ["delivered", "completed"]] },
                      1,
                      0,
                    ],
                  },
                },
                failedOrders: {
                  $sum: {
                    $cond: [
                      { $in: ["$status", ["cancelled", "failed", "returned"]] },
                      1,
                      0,
                    ],
                  },
                },
                pendingOrders: {
                  $sum: {
                    $cond: [
                      {
                        $in: [
                          "$status",
                          ["pending", "processing", "awaiting_payment"],
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
              },
            },
          ],
          previousPeriod: [
            {
              $match: {
                createdAt: {
                  $gte: previousPeriodStart,
                  $lt: currentPeriodStart,
                },
              },
            },
            {
              $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                successfulOrders: {
                  $sum: {
                    $cond: [
                      { $in: ["$status", ["delivered", "completed"]] },
                      1,
                      0,
                    ],
                  },
                },
                failedOrders: {
                  $sum: {
                    $cond: [
                      { $in: ["$status", ["cancelled", "failed", "returned"]] },
                      1,
                      0,
                    ],
                  },
                },
                pendingOrders: {
                  $sum: {
                    $cond: [
                      {
                        $in: [
                          "$status",
                          ["pending", "processing", "awaiting_payment"],
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
              },
            },
          ],
        },
      },
    ]);

    const current = metrics[0].currentPeriod[0] || {
      totalOrders: 0,
      successfulOrders: 0,
      failedOrders: 0,
      pendingOrders: 0,
    };

    const previous = metrics[0].previousPeriod[0] || {
      totalOrders: 0,
      successfulOrders: 0,
      failedOrders: 0,
      pendingOrders: 0,
    };

    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Number((((current - previous) / previous) * 100).toFixed(1));
    };

    const formatNumber = (num: number) => {
      return new Intl.NumberFormat("en-US").format(num);
    };

    res.json({
      success: true,
      metrics: {
        totalOrders: {
          title: "Total Orders",
          value: formatNumber(current.totalOrders),
          rawValue: current.totalOrders,
          change: calculateChange(current.totalOrders, previous.totalOrders),
          trend: current.totalOrders >= previous.totalOrders ? "up" : "down",
        },
        successfulOrders: {
          title: "Successful Orders",
          value: formatNumber(current.successfulOrders),
          rawValue: current.successfulOrders,
          change: calculateChange(
            current.successfulOrders,
            previous.successfulOrders
          ),
          trend:
            current.successfulOrders >= previous.successfulOrders
              ? "up"
              : "down",
        },
        failedOrders: {
          title: "Order Refunded",
          value: formatNumber(current.failedOrders),
          rawValue: current.failedOrders,
          change: calculateChange(current.failedOrders, previous.failedOrders),
          trend: current.failedOrders <= previous.failedOrders ? "up" : "down", // Inverted for failed orders
        },
        pendingOrders: {
          title: "Pending Orders",
          value: formatNumber(current.pendingOrders),
          rawValue: current.pendingOrders,
          change: calculateChange(
            current.pendingOrders,
            previous.pendingOrders
          ),
          trend:
            current.pendingOrders >= previous.pendingOrders ? "up" : "down",
        },
      },
      period: `Last ${days} days`,
    });
  } catch (err) {
    next(err);
  }
};

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
      { trackingNumber, carrier }
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
