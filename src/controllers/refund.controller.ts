import { Request, Response } from "express";
import Order from "../models/order.model";
import Issue from "../models/issue.model";
import Wallet from "../models/wallet.model";
import Payment from "../models/payment.model";
import Notification from "../models/notification.model";
import AuditLogService from "../services/audit-log.service";

export const processRefund = async (req: Request, res: Response) => {
  try {
    const { issueId } = req.params;
    const { refundAmount, reason } = req.body;
    const adminId = req.userId;

    const issue = await Issue.findById(issueId).populate('orderId');
    if (!issue) {
      return res.status(404).json({ success: false, message: "Issue not found" });
    }

    if (issue.status !== "resolved") {
      return res.status(400).json({ success: false, message: "Issue must be resolved first" });
    }

    const order = issue.orderId as any;
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Check delivery date + 3 days
    const deliveryDate = new Date(order.shipping.estimatedDelivery || order.updatedAt);
    const threeDaysAfter = new Date(deliveryDate.getTime() + 3 * 24 * 60 * 60 * 1000);
    
    if (new Date() < threeDaysAfter) {
      return res.status(400).json({ 
        success: false, 
        message: "Refund can only be processed 3 days after delivery" 
      });
    }

    // Check if product is returned
    const hasReturnedItems = order.rejectedItems && order.rejectedItems.length > 0;
    if (!hasReturnedItems) {
      return res.status(400).json({ 
        success: false, 
        message: "Product must be returned before refund" 
      });
    }

    // Process refund to wallet
    const wallet = await Wallet.findOne({ userId: order.userId });
    if (!wallet) {
      return res.status(404).json({ success: false, message: "User wallet not found" });
    }

    wallet.balance += refundAmount;
    wallet.transactions.push({
      type: "credit",
      amount: refundAmount,
      description: `Refund for issue ${issue.caseId}: ${reason}`,
      relatedOrder: order._id,
      date: new Date()
    });
    await wallet.save();

    // Update payment status
    await Payment.findByIdAndUpdate(order.paymentId, {
      status: "refunded",
      refundDetails: {
        amount: refundAmount,
        reason,
        status: "processed",
        date: new Date()
      }
    });

    // Notify user
    await Notification.create({
      userId: order.userId,
      type: "refund",
      case: "processed",
      title: "Refund Processed",
      message: `Your refund of $${refundAmount} for issue ${issue.caseId} has been processed to your wallet.`,
      data: {
        redirectUrl: `/wallet`,
        entityId: issueId,
        entityType: "refund"
      }
    });

    // Log action
    await AuditLogService.log(
      "REFUND_PROCESSED",
      "refund",
      "info",
      {
        issueId,
        orderId: order._id,
        amount: refundAmount,
        processedBy: adminId,
        reason
      },
      req,
      issueId
    );

    res.json({
      success: true,
      message: "Refund processed successfully",
      data: { amount: refundAmount, walletBalance: wallet.balance }
    });
  } catch (error) {
    console.error("Process refund error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getRefundEligibility = async (req: Request, res: Response) => {
  try {
    const { issueId } = req.params;

    const issue = await Issue.findById(issueId).populate('orderId');
    if (!issue) {
      return res.status(404).json({ success: false, message: "Issue not found" });
    }

    const order = issue.orderId as any;
    const deliveryDate = new Date(order.shipping.estimatedDelivery || order.updatedAt);
    const threeDaysAfter = new Date(deliveryDate.getTime() + 3 * 24 * 60 * 60 * 1000);
    const thirtyDaysAfter = new Date(deliveryDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const isEligible = 
      issue.status === "resolved" &&
      new Date() >= threeDaysAfter &&
      new Date() <= thirtyDaysAfter &&
      order.rejectedItems?.length > 0;

    res.json({
      success: true,
      data: {
        eligible: isEligible,
        deliveryDate,
        eligibleFrom: threeDaysAfter,
        eligibleUntil: thirtyDaysAfter,
        hasReturnedItems: order.rejectedItems?.length > 0,
        issueResolved: issue.status === "resolved"
      }
    });
  } catch (error) {
    console.error("Get refund eligibility error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};