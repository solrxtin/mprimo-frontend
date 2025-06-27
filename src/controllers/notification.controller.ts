import { NextFunction, Request, Response } from "express";
import Notification from "../models/notification.model";

export const getAllNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const notifications = await Notification.findOne({ userId: req.userId });
    console.log("Notifications are: ", notifications)
    res.status(200).json({
      success: true,
      message: "User notifications successfully fetched",
      notifications,
    });
  } catch (error) {
    next(error);
  }
};
