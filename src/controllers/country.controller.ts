import { Request, Response } from "express";
import Country from "../models/country.model";
import PaymentOption from "../models/payment-options.model";
import mongoose from "mongoose";

export const getCountries = async (req: Request, res: Response) => {
  try {
    const countries = await Country.find({ delisted: false }).populate(
      "paymentOptions"
    );
    res.status(200).json({
      success: true,
      data: countries,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch countries",
      error: error.message,
    });
  }
};

export const getAllCountries = async (req: Request, res: Response) => {
  try {
    const countries = await Country.find().populate("paymentOptions");
    res.status(200).json({
      success: true,
      data: countries,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch countries",
      error: error.message,
    });
  }
};

export const getCountryById = async (req: Request, res: Response) => {
  try {
    const country = await Country.findById(req.params.id).populate(
      "paymentOptions"
    );
    if (!country) {
      return res.status(404).json({
        success: false,
        message: "Country not found",
      });
    }
    res.status(200).json({
      success: true,
      data: country,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch country",
    });
  }
};

export const createCountry = async (req: Request, res: Response) => {
  try {
    const {
      name,
      currency,
      currencySymbol,
      mprimoAccountDetails,
      paymentOptions,
      bidIncrement,
    } = req.body;

    if (!name || !currency || !currencySymbol) {
      return res.status(400).json({
        success: false,
        message: "Name, currency, and currency symbol are required",
      });
    }

    // Check if country already exists
    const existingCountry = await Country.findOne({ name });
    if (existingCountry) {
      return res.status(400).json({
        success: false,
        message: "Country with this name already exists",
      });
    }

    // Validate payment options if provided
    if (paymentOptions && paymentOptions.length > 0) {
      const validPaymentOptions = await PaymentOption.find({
        _id: { $in: paymentOptions },
      });
      if (validPaymentOptions.length !== paymentOptions.length) {
        return res.status(400).json({
          success: false,
          message: "One or more payment options are invalid",
        });
      }
    }

    const country = new Country({
      name,
      currency,
      currencySymbol,
      bidIncrement,
      mprimoAccountDetails,
      paymentOptions,
      createdBy: req.userId,
      updatedBy: req.userId,
    });

    await country.save();

    res.status(201).json({
      success: true,
      message: "Country created successfully",
      data: country,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to create country",
      error: error.message,
    });
  }
};

export const updateCountry = async (req: Request, res: Response) => {
  try {
    const {
      name,
      currency,
      currencySymbol,
      exchangeRate,
      paymentOptions,
      delisted,
    } = req.body;
    const userId = req.userId;

    const country = await Country.findById(req.params.id);
    if (!country) {
      return res.status(404).json({
        success: false,
        message: "Country not found",
      });
    }

    // Update fields if provided
    if (name !== undefined) country.name = name;
    if (currency !== undefined) country.currency = currency;
    if (currencySymbol !== undefined) country.currencySymbol = currencySymbol;
    if (exchangeRate !== undefined) country.exchangeRate = exchangeRate;
    if (delisted !== undefined) country.delisted = delisted;

    // Validate and update payment options if provided
    if (paymentOptions !== undefined) {
      if (paymentOptions.length > 0) {
        const validPaymentOptions = await PaymentOption.find({
          _id: { $in: paymentOptions },
        });
        if (validPaymentOptions.length !== paymentOptions.length) {
          return res.status(400).json({
            success: false,
            message: "One or more payment options are invalid",
          });
        }
      }
      country.paymentOptions = paymentOptions;
    }

    // Always update the updatedBy field
    country.updatedBy = userId;

    await country.save();

    res.status(200).json({
      success: true,
      message: "Country updated successfully",
      data: country,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to update country",
      error: error.message,
    });
  }
};

export const deleteCountry = async (req: Request, res: Response) => {
  try {
    const country = await Country.findById(req.params.id);
    if (!country) {
      return res.status(404).json({
        success: false,
        message: "Country not found",
      });
    }

    await country.deleteOne();

    res.status(200).json({
      success: true,
      message: "Country deleted successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to delete country",
      error: error.message,
    });
  }
};

export const delistCountry = async (req: Request, res: Response) => {
  try {
    const country = await Country.findById(req.params.id);
    if (!country) {
      return res.status(404).json({
        success: false,
        message: "Country not found",
      });
    }

    country.delisted = true;
    country.updatedBy = req.userId;
    await country.save();

    res.status(200).json({
      success: true,
      message: "Country delisted successfully",
      data: country,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to delist country",
      error: error.message,
    });
  }
};

export const updatePaymentOptions = async (req: Request, res: Response) => {
  try {
    const { paymentOptions } = req.body;
    const countryId = req.params.id;

    if (!Array.isArray(paymentOptions)) {
      return res.status(400).json({
        success: false,
        message: "Payment options must be an array of IDs",
      });
    }

    if (!paymentOptions.every((id) => mongoose.Types.ObjectId.isValid(id))) {
      return res.status(400).json({
        success: false,
        message: "One or more payment option IDs are not valid ObjectIds",
      });
    }

    const country = await Country.findById(countryId);
    if (!country) {
      return res.status(404).json({
        success: false,
        message: "Country not found",
      });
    }

    // Validate payment options
    const validPaymentOptions = await PaymentOption.find({
      _id: { $in: paymentOptions },
    });
    if (validPaymentOptions.length !== paymentOptions.length) {
      return res.status(400).json({
        success: false,
        message: "One or more payment options are invalid",
      });
    }

    country.paymentOptions = paymentOptions;
    country.updatedBy = req.userId;
    await country.save();

    res.status(200).json({
      success: true,
      message: "Payment options updated successfully",
      data: country,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to update payment options",
      error: error.message,
    });
  }
};

export const getCountryStats = async (req: Request, res: Response) => {
  try {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [totalCountries, delistedCountries, recentCountries] =
      await Promise.all([
        Country.countDocuments(),
        Country.countDocuments({ delisted: true }),
        Country.countDocuments({ createdAt: { $gte: oneWeekAgo } }),
      ]);

    res.status(200).json({
      success: true,
      message: "Country stats fetched successfully",
      data: {
        totalCountries,
        delistedCountries,
        recentlyAddedCountries: recentCountries,
      },
    });
  } catch (error: any) {
    console.error("getCountryStats Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while fetching country stats",
    });
  }
};
