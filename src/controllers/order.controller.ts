import { NextFunction, Request, Response } from "express";
import User from "../models/user.model";
import { generateTrackingNumber } from "../utils/generateTrackingNumber";
import Order from "../models/order.model";
import Notification from "../models/notification.model";
import Product from "../models/product.model";
import { redisService, socketService } from "..";
import { ItemType } from "../types/order.type";
import mongoose from "mongoose";

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
  const userId = req.userId

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

    res.status(201).json({ message: "Order created successfully", order });
  } catch (error) {
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
  const userId = req.userId;

  try {
    const orders = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .populate({
        path: "items.productId",
        select: "name images inventory reviews ratings vendorId",
        populate: {
          path: "vendorId",
          select: "businessInfo.name accountType ratings.average",
        },
      });

    res.status(200).json({
      orders,
      message: "User orders fetched successfully",
      success: true,
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
  const orderId = req.params.id;

  try {
    const order = await Order.findById(orderId)
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

    if (!order) {
      res.status(404).json({
        success: false,
        message: "Order not found",
      });
      return;
    }

    res.status(200).json({
      order,
      message: "Order fetched successfully",
      success: true,
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
