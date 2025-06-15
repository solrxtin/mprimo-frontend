import { Request, Response } from "express";
import Country from "../models/country.model";

export const getCountries = async (req: Request, res: Response) => {
  try {
    const countries = await Country.find({ delisted: false });
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
    const country = await Country.findById(req.params.id);
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
    const { name, currency } = req.body;
    
    // Check if country already exists
    const existingCountry = await Country.findOne({ name });
    if (existingCountry) {
      return res.status(400).json({
        success: false,
        message: "Country with this name already exists",
      });
    }
    
    const country = new Country({
      name,
      currency,
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
    const { name, currency, delisted } = req.body;
    const userId = req.userId
    
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
    if (delisted !== undefined) country.delisted = delisted;
    
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