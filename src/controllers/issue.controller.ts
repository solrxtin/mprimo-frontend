import { Request, Response } from "express";
import Issue from "../models/issue.model";
import Order from "../models/order.model";

export const raiseIssue = async (req: Request, res: Response) => {
  try {
    const { orderId, reason, description } = req.body;
    const userId = req.userId;

    if (!orderId || !reason) {
      return res.status(400).json({
        success: false,
        message: "Order ID and reason are required",
      });
    }

    // Verify order exists and belongs to user
    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found or access denied",
      });
    }

    // Check if order is delivered
    if (order.shipping?.status !== "shipped" && order.shipping?.status !== "delivered") {
      return res.status(400).json({
        success: false,
        message: "Issues can only be raised for delivered or shipped orders",
      });
    }

    // Check if issue already exists for this order
    const existingIssue = await Issue.findOne({ orderId, userId });
    if (existingIssue) {
      return res.status(400).json({
        success: false,
        message: "An issue has already been raised for this order",
      });
    }

    const issue = new Issue({
      orderId,
      userId,
      reason,
      description,
    });

    await issue.save();

    res.status(201).json({
      success: true,
      message: "Issue raised successfully",
      data: {
        caseId: issue.caseId,
        orderId: issue.orderId,
        reason: issue.reason,
        status: issue.status,
        createdAt: issue.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Raise Issue Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while raising issue",
    });
  }
};

export const getUserIssues = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 10, status } = req.query;

    const query: any = { userId };
    if (status) query.status = status;

    const issues = await Issue.find(query)
      .populate("orderId", "_id items createdAt")
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await Issue.countDocuments(query);

    res.status(200).json({
      success: true,
      message: "Issues retrieved successfully",
      data: {
        issues,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error: any) {
    console.error("Get User Issues Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while fetching issues",
    });
  }
};