import { Request, Response } from "express";
import { VendorPayment } from "../models/payment.model";
import Order from "../models/order.model";
import Vendor from "../models/vendor.model";
import Notification from "../models/notification.model";
import AuditLogService from "../services/audit-log.service";

export const requestPayout = async (req: Request, res: Response) => {
  try {
    const {vendorId} = req.params;
    const { orderId, method, accountDetails } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Check if order is delivered and past dispute window (7 days)
    if (order.shipping.status !== "delivered") {
      return res.status(400).json({ 
        success: false, 
        message: "Order must be delivered before payout request" 
      });
    }

    const deliveryDate = new Date(order.shipping.estimatedDelivery || order.updatedAt);
    const disputeWindow = new Date(deliveryDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    if (new Date() < disputeWindow) {
      return res.status(400).json({ 
        success: false, 
        message: "Payout available 7 days after delivery" 
      });
    }

    // Check for existing payout request
    const existingPayout = await VendorPayment.findOne({ orderId, vendorId });
    if (existingPayout) {
      return res.status(400).json({ 
        success: false, 
        message: "Payout already requested for this order" 
      });
    }

    // Calculate payout amount (order total minus platform fee)
    const orderTotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const platformFee = orderTotal * 0.05; // 5% platform fee
    const payoutAmount = orderTotal - platformFee;

    const vendorPayment = await VendorPayment.create({
      vendorId,
      orderId,
      amount: payoutAmount,
      method,
      status: "pending"
    });

    // Notify admin for approval
    await Notification.create({
      userId: null, // Admin notification
      type: "payout",
      case: "request",
      title: "Vendor Payout Request",
      message: `Vendor payout request of $${payoutAmount} for order ${orderId}`,
      data: {
        redirectUrl: `/admin/payouts/${vendorPayment._id}`,
        entityId: vendorPayment._id,
        entityType: "payout"
      }
    });

    // Log action
    await AuditLogService.log(
      "PAYOUT_REQUESTED",
      "payout",
      "info",
      {
        vendorId,
        orderId,
        amount: payoutAmount,
        method
      },
      req,
      vendorPayment._id.toString()
    );

    res.json({
      success: true,
      message: "Payout request submitted successfully",
      data: vendorPayment
    });
  } catch (error) {
    console.error("Request payout error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getVendorPayouts = async (req: Request, res: Response) => {
  try {
    const {vendorId} = req.params;
    const { page = 1, limit = 10, status } = req.query;

    const query: any = { vendorId };
    if (status) query.status = status;

    const payouts = await VendorPayment.find(query)
      .populate('orderId', '_id items shipping.status createdAt')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await VendorPayment.countDocuments(query);

    res.json({
      success: true,
      data: {
        payouts,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error("Get vendor payouts error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getPayoutEligibleOrders = async (req: Request, res: Response) => {
  try {
    const {vendorId} = req.params;

    // Find delivered orders past dispute window without payout requests
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const eligibleOrders = await Order.aggregate([
      {
        $lookup: {
          from: "products",
          localField: "items.productId",
          foreignField: "_id",
          as: "products"
        }
      },
      {
        $match: {
          "products.vendorId": vendorId,
          "shipping.status": "delivered",
          "updatedAt": { $lte: sevenDaysAgo }
        }
      },
      {
        $lookup: {
          from: "vendorpayments",
          localField: "_id",
          foreignField: "orderId",
          as: "payouts"
        }
      },
      {
        $match: {
          "payouts": { $size: 0 }
        }
      },
      {
        $project: {
          _id: 1,
          items: 1,
          shipping: 1,
          createdAt: 1,
          updatedAt: 1,
          totalAmount: {
            $reduce: {
              input: "$items",
              initialValue: 0,
              in: { $add: ["$$value", { $multiply: ["$$this.price", "$$this.quantity"] }] }
            }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: eligibleOrders
    });
  } catch (error) {
    console.error("Get payout eligible orders error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Admin Payout Management
export const getAllPayouts = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, status, vendorId } = req.query;

    const query: any = {};
    if (status) query.status = status;
    if (vendorId) query.vendorId = vendorId;

    const payouts = await VendorPayment.find(query)
      .populate('vendorId', 'businessInfo.name userId')
      .populate('orderId', '_id items createdAt')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await VendorPayment.countDocuments(query);

    res.json({
      success: true,
      data: {
        payouts,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error("Get all payouts error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const approvePayout = async (req: Request, res: Response) => {
  try {
    const { payoutId } = req.params;
    const adminId = req.userId;

    const payout = await VendorPayment.findByIdAndUpdate(
      payoutId,
      { status: "completed" },
      { new: true }
    ).populate('vendorId', 'userId businessInfo.name');

    if (!payout) {
      return res.status(404).json({ success: false, message: "Payout not found" });
    }

    // Notify vendor
    await Notification.create({
      userId: (payout.vendorId as any).userId,
      type: "payout",
      case: "approved",
      title: "Payout Approved",
      message: `Your payout request of $${payout.amount} has been approved and processed.`,
      data: {
        redirectUrl: `/vendor/payouts`,
        entityId: payoutId,
        entityType: "payout"
      }
    });

    // Log action
    await AuditLogService.log(
      "PAYOUT_APPROVED",
      "payout",
      "info",
      {
        payoutId,
        vendorId: payout.vendorId,
        amount: payout.amount,
        approvedBy: adminId
      },
      req,
      payoutId
    );

    res.json({
      success: true,
      message: "Payout approved successfully",
      data: payout
    });
  } catch (error) {
    console.error("Approve payout error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const rejectPayout = async (req: Request, res: Response) => {
  try {
    const { payoutId } = req.params;
    const { reason } = req.body;
    const adminId = req.userId;

    const payout = await VendorPayment.findByIdAndUpdate(
      payoutId,
      { status: "failed" },
      { new: true }
    ).populate('vendorId', 'userId businessInfo.name');

    if (!payout) {
      return res.status(404).json({ success: false, message: "Payout not found" });
    }

    // Notify vendor
    await Notification.create({
      userId: (payout.vendorId as any).userId,
      type: "payout",
      case: "rejected",
      title: "Payout Rejected",
      message: `Your payout request of $${payout.amount} has been rejected. Reason: ${reason}`,
      data: {
        redirectUrl: `/vendor/payouts`,
        entityId: payoutId,
        entityType: "payout"
      }
    });

    // Log action
    await AuditLogService.log(
      "PAYOUT_REJECTED",
      "payout",
      "warning",
      {
        payoutId,
        vendorId: payout.vendorId,
        amount: payout.amount,
        rejectedBy: adminId,
        reason
      },
      req,
      payoutId
    );

    res.json({
      success: true,
      message: "Payout rejected successfully",
      data: payout
    });
  } catch (error) {
    console.error("Reject payout error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};


// import { Request, Response } from 'express';
// import Stripe from 'stripe';
// import Vendor from '../models/vendor.model';
// import { LoggerService } from '../services/logger.service';

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
//   apiVersion: '2024-06-20',
// });

// const logger = LoggerService.getInstance();

// export const createVendorPayout = async (req: Request, res: Response) => {
//   try {
//     const { vendorId, amount, currency = 'usd', description } = req.body;
//     const adminId = req.userId;

//     if (!adminId) {
//       return res.status(401).json({ success: false, message: 'Unauthorized' });
//     }

//     const vendor = await Vendor.findById(vendorId);
//     if (!vendor?.stripeAccountId) {
//       return res.status(404).json({ 
//         success: false, 
//         message: 'Vendor not found or not verified' 
//       });
//     }

//     // Check if vendor is verified and eligible for payouts
//     if (vendor.stripeVerificationStatus !== 'verified') {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Vendor not verified for payouts' 
//       });
//     }

//     // Create transfer to vendor's Stripe account
//     const transfer = await stripe.transfers.create({
//       amount: Math.round(amount * 100), // Convert to cents
//       currency,
//       destination: vendor.stripeAccountId,
//       description: description || `Payout to vendor ${vendorId}`,
//       metadata: {
//         vendorId: vendorId.toString(),
//         adminId: adminId.toString(),
//         type: 'vendor_payout'
//       }
//     });

//     // Update vendor wallet
//     vendor.wallet.balance += amount;
//     vendor.wallet.transactions.push({
//       type: 'credit',
//       amount,
//       description: description || 'Admin payout',
//       date: new Date()
//     });
//     await vendor.save();

//     logger.info(`Payout created: ${transfer.id} for vendor ${vendorId}`);

//     res.json({
//       success: true,
//       transferId: transfer.id,
//       amount,
//       currency,
//       status: transfer.status
//     });

//   } catch (error: any) {
//     logger.error('Payout creation failed:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: error.message 
//     });
//   }
// };

// export const getVendorPayoutHistory = async (req: Request, res: Response) => {
//   try {
//     const { vendorId } = req.params;
//     const { limit = 10, starting_after } = req.query;

//     const vendor = await Vendor.findById(vendorId);
//     if (!vendor?.stripeAccountId) {
//       return res.status(404).json({ 
//         success: false, 
//         message: 'Vendor not found' 
//       });
//     }

//     const transfers = await stripe.transfers.list({
//       destination: vendor.stripeAccountId,
//       limit: Number(limit),
//       ...(starting_after && { starting_after: starting_after as string })
//     });

//     res.json({
//       success: true,
//       payouts: transfers.data.map(transfer => ({
//         id: transfer.id,
//         amount: transfer.amount / 100,
//         currency: transfer.currency,
//         description: transfer.description,
//         created: transfer.created,
//         status: transfer.status,
//         metadata: transfer.metadata
//       })),
//       has_more: transfers.has_more
//     });

//   } catch (error: any) {
//     res.status(500).json({ 
//       success: false, 
//       message: error.message 
//     });
//   }
// };