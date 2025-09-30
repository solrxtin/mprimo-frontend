import { Request, Response } from "express";
import Advertisement from "../models/advertisement.model";
import { Types } from "mongoose";
import Vendor from "../models/vendor.model";
import Notification from "../models/notification.model";
import redisService from "../services/redis.service";

export class AdvertisementController {
  // Methods for managing advertisements will go here
  static async trackImpression(req: Request, res: Response) {
    const { id } = req.params;
    await Advertisement.findByIdAndUpdate(id, { $inc: { impressions: 1 } });
    res.sendStatus(200);
  }

  static async trackClick(req: Request, res: Response) {
    const { id } = req.params;
    const ad = await Advertisement.findByIdAndUpdate(id, {
      $inc: { clicks: 1 },
    });
    if (ad?.targetUrl) {
      return res.redirect(ad.targetUrl);
    }
    res.status(404).send("Ad not found");
  }

  static async createAdvertisement(req: Request, res: Response) {
    try {
      const {
        vendorId,
        productId,
        title,
        description,
        imageUrl,
        adType,
        duration,
        cost,
      } = req.body;

      // Basic validation
      if (
        !vendorId ||
        !productId ||
        !title ||
        !imageUrl ||
        !adType ||
        !duration ||
        !cost
      ) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields",
        });
      }

      if (!["banner", "featured", "sponsored"].includes(adType)) {
        return res.status(400).json({
          success: false,
          message: "Invalid ad type",
        });
      }

      const userId = req.userId;
      const vendor = await Vendor.findById(vendorId);
      if (!vendor) {
        return res
          .status(404)
          .json({ success: false, message: "Vendor not found" });
      }
      if (!userId || userId.toString() !== vendor.userId.toString()) {
        return res.status(403).json({ success: false, message: "Forbidden" });
      }

      // Create advertisement
      const advert = await Advertisement.create({
        vendorId: new Types.ObjectId(vendorId),
        productId: new Types.ObjectId(productId),
        title,
        description,
        imageUrl,
        targetUrl: `/products/${productId}`, // Assuming a standard product URL format
        adType,
        duration,
        cost,
        status: "pending",
        impressions: 0,
        clicks: 0,
      });

      //  Notify vendor about the new advertisement submission
      await Notification.create({
        userId: vendor.userId,
        type: "system",
        case: "advertisement_submission",
        title: "Advertisement Submitted",
        message: `Your advertisement "${title}" has been submitted and is pending approval.`,
        data: { advertisementId: advert._id },
        isRead: false,
      });

      res.status(201).json({ success: true, advertisement: advert });
    } catch (error) {
      res.status(500).json({ success: false, message: "Server Error", error });
    }
  }
  static async getSponsoredAds(req: Request, res: Response) {
    try {
      const userId = req.userId;

      // Get recommended product IDs based on user behavior
      const recommendedProductIds = await redisService.getUserRecommendations(
        userId,
        20
      );

      const objectIds = recommendedProductIds.map(id => new Types.ObjectId(id));

      // Find sponsored ads linked to those products
      const ads = await Advertisement.find({
        status: "active",
        adType: "sponsored",
        productId: { $in: objectIds },
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() },
      })
        .sort({ createdAt: -1 })
        .limit(20);

      res.json({
        success: true,
        message: "Sponsored ads fetched successfully",
        data: ads,
      });
    } catch (error) {
      console.error("Error fetching sponsored ads:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
}
