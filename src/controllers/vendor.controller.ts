import { Request, Response, NextFunction } from "express";
import Vendor from "../models/vendor.model";
import Advertisement from "../models/advertisement.model";
import SubscriptionPlan from "../models/subscription-plan.model";
import { uploadImageToCloudinary } from "../config/multer.config";

export const uploadDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No document provided",
      });
    }

    const { documentType, documentName } = req.body;
    const vendorId = req.userId;

    if (!documentType || !documentName) {
      return res.status(400).json({
        success: false,
        message: "Document type and name are required",
      });
    }

    // Upload document to Cloudinary
    const result = await uploadImageToCloudinary(req.file.path, 'verification-documents');

    // Find vendor and update verification documents
    const vendor = await Vendor.findOne({ userId: vendorId });
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    // Add document to verification documents array
    vendor.verificationDocuments.push({
      name: documentName,
      type: documentType,
      url: result.url,
      uploadedAt: new Date(),
      status: "pending"
    });

    await vendor.save();

    res.status(200).json({
      success: true,
      message: "Document uploaded successfully",
      document: {
        name: documentName,
        type: documentType,
        url: result.url,
        status: "pending"
      }
    });
  } catch (error) {
    console.error("Upload document error:", error);
    next(error);
  }
};

/**
 * #swagger.tags = ['Vendor - Advertisements']
 * #swagger.summary = 'Create Advertisement'
 * #swagger.description = 'Create a new advertisement (requires active subscription with ad credits)'
 * #swagger.security = [{ "Bearer": [] }]
 * #swagger.consumes = ['multipart/form-data']
 * #swagger.parameters['image'] = {
 *   in: 'formData',
 *   type: 'file',
 *   required: true,
 *   description: 'Advertisement image file'
 * }
 * #swagger.parameters['body'] = {
 *   in: 'formData',
 *   schema: { $ref: '#/definitions/Advertisement' }
 * }
 * #swagger.responses[201] = {
 *   description: 'Advertisement created successfully',
 *   schema: {
 *     type: 'object',
 *     properties: {
 *       success: { type: 'boolean' },
 *       message: { type: 'string' },
 *       data: { $ref: '#/definitions/Advertisement' }
 *     }
 *   }
 * }
 * #swagger.responses[403] = {
 *   description: 'Subscription plan does not allow advertisements'
 * }
 */
export const createAdvertisement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, targetUrl, adType, duration } = req.body;
    const vendorId = req.userId;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Advertisement image is required"
      });
    }

    // Find vendor and check subscription
    const vendor = await Vendor.findOne({ userId: vendorId }).populate('subscription.currentPlan');
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found"
      });
    }

    // Check if vendor has an active subscription plan
    if (!vendor.subscription.currentPlan) {
      return res.status(403).json({
        success: false,
        message: "You need an active subscription plan to create advertisements"
      });
    }

    const plan = vendor.subscription.currentPlan as any;
    
    // Check if vendor has ad credits
    if (plan.adCreditMonthly <= 0) {
      return res.status(403).json({
        success: false,
        message: "Your current plan does not include advertisement credits"
      });
    }

    // Upload image to Cloudinary
    const imageResult = await uploadImageToCloudinary(req.file.path, 'advertisements');

    // Calculate cost based on ad type and duration
    let baseCost = 0;
    switch (adType) {
      case 'banner': baseCost = 10; break;
      case 'featured': baseCost = 25; break;
      case 'sponsored': baseCost = 50; break;
      default: baseCost = 10;
    }
    const totalCost = baseCost * duration;

    // Create advertisement
    const advertisement = await Advertisement.create({
      vendorId: vendor._id,
      title,
      description,
      imageUrl: imageResult.url,
      targetUrl,
      adType,
      duration,
      cost: totalCost,
      status: 'pending'
    });

    // Update vendor analytics - track advertisement creation
    await Vendor.findByIdAndUpdate(vendor._id, {
      $inc: { 'analytics.adsCreated': 1 },
      $set: { 'analytics.lastAdCreated': new Date() }
    });

    res.status(201).json({
      success: true,
      message: "Advertisement created successfully and submitted for review",
      data: advertisement
    });
  } catch (error) {
    console.error("Create advertisement error:", error);
    next(error);
  }
};

/**
 * #swagger.tags = ['Vendor - Advertisements']
 * #swagger.summary = 'Get Vendor Advertisements'
 * #swagger.description = 'Retrieve all advertisements for the authenticated vendor'
 * #swagger.security = [{ "Bearer": [] }]
 * #swagger.parameters['page'] = {
 *   in: 'query',
 *   type: 'integer',
 *   description: 'Page number'
 * }
 * #swagger.parameters['limit'] = {
 *   in: 'query',
 *   type: 'integer',
 *   description: 'Items per page'
 * }
 * #swagger.parameters['status'] = {
 *   in: 'query',
 *   type: 'string',
 *   enum: ['pending', 'approved', 'rejected', 'active', 'expired'],
 *   description: 'Filter by advertisement status'
 * }
 */
export const getVendorAdvertisements = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vendorId = req.userId;
    const { page = 1, limit = 10, status } = req.query;

    const vendor = await Vendor.findOne({ userId: vendorId });
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found"
      });
    }

    const query: any = { vendorId: vendor._id };
    if (status) query.status = status;

    const advertisements = await Advertisement.find(query)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await Advertisement.countDocuments(query);

    res.json({
      success: true,
      data: {
        advertisements,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error("Get vendor advertisements error:", error);
    next(error);
  }
};

export const getVendorUsage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    
    const vendor = await Vendor.findOne({ userId });
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found"
      });
    }

    const { VendorUsageService } = await import('../services/vendor-usage.service');
    const [usage, warnings] = await Promise.all([
      VendorUsageService.getVendorUsage(vendor._id.toString()),
      VendorUsageService.getUsageWarnings(vendor._id.toString())
    ]);

    res.json({
      success: true,
      data: {
        usage,
        warnings
      }
    });
  } catch (error) {
    console.error("Get vendor usage error:", error);
    next(error);
  }
};