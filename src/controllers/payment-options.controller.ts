import { Request, Response } from "express";
import PaymentOption from "../models/payment-options.model";

export const getPaymentOptions = async (req: Request, res: Response) => {
  try {
    const paymentOptions = await PaymentOption.find();
    res.status(200).json({
      success: true,
      data: paymentOptions,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment options",
      error: error.message,
    });
  }
};

export const createPaymentOption = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    const existingOption = await PaymentOption.findOne({ name });
    if (existingOption) {
      return res.status(400).json({
        success: false,
        message: "Payment option already exists",
      });
    }

    const paymentOption = new PaymentOption({ name });
    await paymentOption.save();

    res.status(201).json({
      success: true,
      message: "Payment option created successfully",
      data: paymentOption,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to create payment option",
      error: error.message,
    });
  }
};

export const updatePaymentOption = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    
    const paymentOption = await PaymentOption.findById(req.params.id);
    if (!paymentOption) {
      return res.status(404).json({
        success: false,
        message: "Payment option not found",
      });
    }

    if (name) paymentOption.name = name;
    await paymentOption.save();

    res.status(200).json({
      success: true,
      message: "Payment option updated successfully",
      data: paymentOption,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to update payment option",
      error: error.message,
    });
  }
};

export const deletePaymentOption = async (req: Request, res: Response) => {
  try {
    const paymentOption = await PaymentOption.findById(req.params.id);
    if (!paymentOption) {
      return res.status(404).json({
        success: false,
        message: "Payment option not found",
      });
    }

    await paymentOption.deleteOne();

    res.status(200).json({
      success: true,
      message: "Payment option deleted successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to delete payment option",
      error: error.message,
    });
  }
};