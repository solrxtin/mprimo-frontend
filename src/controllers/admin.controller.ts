/*************COUNTRY CONTROLLERS */
import { Request, Response } from "express";
import Country, { ICountry } from "../models/country.model";
import SubscriptionPlan from "../models/subscription-plan.model";
import Vendor from "../models/vendor.model";
import Product from "../models/product.model";
import mongoose from "mongoose";
import User from "../models/user.model";
import sendWarningEmail from "../mails/send-vendor-warning.mail";
import Notification from "../models/notification.model";
import Order from "../models/order.model";
import sendSuspensionEmail, {
  sendUnsuspensionEmail,
} from "../mails/send-account-suspended.mail";
import AuditLogService from "../services/audit-log.service";
import AuditLog from "../models/audit-log.model";
import sendVendorVerificationAcceptedEmail from "../mails/send-vendor-verification-accepted.mail";
import sendVendorVerificationRejectedEmail from "../mails/send-vendor-verification-rejected.mail";
import Issue from "../models/issue.model";
import Withdrawal from "../models/withdrawal.model";
import Banner from "../models/banner.model";
import Policy from "../models/policy.model";
import FAQ from "../models/faq.model";
import AdminNotification from "../models/admin-notification.model";
import Advertisement from "../models/advertisement.model";
import Promotion from "../models/promotion.model";
import sendItemReceivedEmail from "../mails/send-vendor-item-received.mail";
import sendItemRejectionEmail from "../mails/send-vendor-item-rejected.email";
import bcrypt from "bcrypt";
import { ROLE_PERMISSIONS } from "../constants/roles.config";
import { IUser } from "../types/user.type";
import UserModel from "../models/user.model";
import sendAdminWelcomeEmail from "../mails/send-admin-welcome.mail";
import { generateQRCode } from "../utils/2fa.util";
import {
  validateCreateAdmin,
  validateChangeRole,
} from "../validators/admin.validator";
import { generateRandomPassword } from "../utils/generate-random-password";
import Payment, { VendorPayment } from "../models/payment.model";
import CategoryModel from "../models/category.model";
import Wallet from "../models/wallet.model";

export class CountryController {
  static async createCountry(req: Request, res: Response) {
    try {
      const {
        name,
        currency,
        currencySymbol,
        exchangeRate,
        mprimoAccountDetails,
        createdBy,
        updatedBy,
        localizedPlans, // expecting: [{ planName, price, transactionFeePercent }]
        bidIncrement,
      } = req.body;

      // 🛡 ValvendorIdate base fields
      if (
        !name ||
        !currency ||
        !currencySymbol ||
        !exchangeRate ||
        !localizedPlans ||
        localizedPlans.length !== 3
      ) {
        return res.status(400).json({
          message:
            "Missing required fields or not exactly three localized plans provided",
          success: false,
        });
      }

      // 📌 ValvendorIdate and map localized plans to actual SubscriptionPlan vendorIds
      const mappedPlans = await Promise.all(
        localizedPlans.map(async (entry: any) => {
          const planDoc = await SubscriptionPlan.findOne({
            name: entry.planName,
          });
          if (!planDoc) {
            throw new Error(`Subscription plan '${entry.planName}' not found`);
          }
          return {
            plan: planDoc._id,
            price: entry.price,
            transactionFeePercent: entry.transactionFeePercent ?? 0,
          };
        })
      );

      // 🚀 Create Country
      const newCountry = await Country.create({
        name,
        currency,
        currencySymbol,
        exchangeRate,
        mprimoAccountDetails,
        createdBy,
        updatedBy,
        localizedSubscritpionPlan: mappedPlans,
        bidIncrement: bidIncrement ?? 0.01,
      });

      return res.status(201).json({
        message: "Country created successfully",
        success: true,
        data: newCountry,
      });
    } catch (error: any) {
      console.error("CreateCountry Error:", error.message);
      return res.status(500).json({
        message: error.message || "Internal server error",
        success: false,
      });
    }
  }

  static async getAllCountries(req: Request, res: Response) {
    try {
      const countries = await Country.find({});
      res.status(200).json({
        success: true,
        countries,
        message: "All countries fetched successfully",
      });
    } catch (err) {
      console.error(err);
      res
        .status(500)
        .json({ message: "Error fetching countries", success: false });
    }
  }

  static async getCountryByvendorId(req: Request, res: Response) {
    try {
      const { countryvendorId } = req.params;
      if (!countryvendorId) {
        return res
          .status(400)
          .json({ message: "Country vendorId is required", success: false });
      }
      const country = await Country.findById(countryvendorId);
      if (country) {
        res.status(200).json({
          message: "Country fetched successfully",
          success: true,
          country,
        });
      } else {
        res.status(404).json({ message: "Country not found" });
      }
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ message: "Error fetching country", success: false });
    }
  }

  static async updateCountry(req: Request, res: Response) {
    try {
      const countryvendorId = req.params.vendorId;
      const {
        currency,
        currencySymbol,
        exchangeRate,
        plan, // Should probably be planvendorId or planName
        price,
        transactionFeePercent,
      } = req.body;

      // ValvendorIdate presence of required fields
      if (!currency && !currencySymbol && !exchangeRate && !plan) {
        return res.status(400).json({
          message: "At least one field is required",
          success: false,
        });
      }

      if (
        plan &&
        (price === undefined || transactionFeePercent === undefined)
      ) {
        return res.status(400).json({
          message:
            "Price and transaction fee percent are required when updating plan",
          success: false,
        });
      }

      // Build update payload dynamically
      const update: any = {};

      if (currency) update.currency = currency;
      if (currencySymbol) update.currencySymbol = currencySymbol;
      if (exchangeRate) update.exchangeRate = exchangeRate;

      // Plan-specific logic
      if (plan) {
        // Assuming you have a field like `localizedPlans` that holds country-specific pricing
        update.$push = {
          localizedPlans: {
            plan,
            price,
            transactionFeePercent,
          },
        };
      }

      // Perform the update
      const country = await Country.findByIdAndUpdate(
        countryvendorId,
        update,
        { new: true } // Return the updated document
      );

      if (country) {
        res.status(200).json({ success: true, data: country });
      } else {
        res.status(404).json({ message: "Country not found", success: false });
      }
    } catch (error: any) {
      console.error("UpdateCountry Error:", error);
      res.status(500).json({ message: "Server error", success: false });
    }
  }

  static async delistCountry(req: Request, res: Response) {
    const countryvendorId = parseInt(req.params.vendorId);
    await Country.findByIdAndUpdate(
      countryvendorId,
      { delisted: true },
      { new: true }
    );
    res.status(204).send();
  }
}

/*************SUBSCRIPTION PLAN CONTROLLERS */
export class SubscriptionPlanController {
  static async createPlan(req: Request, res: Response) {
    try {
      const {
        name,
        productListingLimit,
        featuredProductSlots,
        analyticsDashboard,
        customStoreBranding,
        messagingTools,
        bulkUpload,
        payoutOptions,
        adCreditMonthly,
        prioritySupport,
      } = req.body;

      // ValvendorIdate required fields
      const requiredFields = [
        name,
        productListingLimit,
        customStoreBranding,
        messagingTools,
        payoutOptions,
        prioritySupport,
      ];

      console.log(requiredFields)

      if (requiredFields.some((field) => field === undefined)) {
        return res.status(400).json({
          message: "Missing required fields",
          success: false,
        });
      }

      // ValvendorIdate enums
      const valvendorIdNames = ["Starter", "Pro", "Elite"];
      const valvendorIdStoreBrands = ["none", "basic", "premium"];
      const valvendorIdMessaging = ["basic", "full", "full_priority"];
      const valvendorIdPrioritySupport = ["none", "basic", "premium"];
      const valvendorIdPayouts = ["weekly", "bi-weekly", "instant"];

      if (!valvendorIdNames.includes(name)) {
        return res
          .status(400)
          .json({ message: "InvalvendorId plan name", success: false });
      }
      if (!valvendorIdStoreBrands.includes(customStoreBranding)) {
        return res
          .status(400)
          .json({ message: "InvalvendorId store branding", success: false });
      }
      if (!valvendorIdMessaging.includes(messagingTools)) {
        return res
          .status(400)
          .json({ message: "InvalvendorId messaging tools", success: false });
      }
      if (!valvendorIdPrioritySupport.includes(prioritySupport)) {
        return res.status(400).json({
          message: "InvalvendorId priority support option",
          success: false,
        });
      }

      // 💡 ValvendorIdate payoutOptions array
      const valvendorIdPayoutArray =
        Array.isArray(payoutOptions) &&
        payoutOptions.length > 0 &&
        payoutOptions.every((option: string) =>
          valvendorIdPayouts.includes(option)
        );
      if (!valvendorIdPayoutArray) {
        return res.status(400).json({
          message: "InvalvendorId payout options array",
          success: false,
        });
      }

      const newPlan = await SubscriptionPlan.create(req.body);
      return res.status(201).json({ success: true, data: newPlan });
    } catch (error: any) {
      console.error("CreatePlan Error:", error.message);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getPlans(req: Request, res: Response) {
    try {
      const { vendorId } = req.params;
      const result = vendorId
        ? await Vendor.findById(vendorId).populate('subscriptionPlan')
        : await SubscriptionPlan.find();
      if (!result)
        return res
          .status(404)
          .json({ success: false, message: "Plans or plan not found" });
      return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      console.error("GetPlans Error:", error.message);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getPlanById(req: Request, res: Response) {
    try {
      const { planId } = req.params;
      const plan = await SubscriptionPlan.findById(planId);
      if (!plan)
        return res
          .status(404)
          .json({ success: false, message: "Plan not found" });
      return res.status(200).json({ success: true, data: plan });
    } catch (error: any) {
      console.error("GetPlanById Error:", error.message);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updatePlan(req: Request, res: Response) {
    try {
      const { planId } = req.params;
      const updateFields = req.body;

      // ValvendorIdate allowed fields
      const valvendorIdNames = ["Starter", "Pro", "Elite"];
      const valvendorIdStoreBrands = ["none", "basic", "premium"];
      const valvendorIdMessaging = ["basic", "full", "full_priority"];
      const valvendorIdPrioritySupport = ["none", "basic", "premium"];
      const valvendorIdPayoutOptions = ["weekly", "bi-weekly", "instant"];

      // If name is included, valvendorIdate it
      if (
        "name" in updateFields &&
        !valvendorIdNames.includes(updateFields.name)
      ) {
        return res
          .status(400)
          .json({ message: "InvalvendorId plan name", success: false });
      }

      if (
        "customStoreBranding" in updateFields &&
        !valvendorIdStoreBrands.includes(updateFields.customStoreBranding)
      ) {
        return res.status(400).json({
          message: "InvalvendorId store branding option",
          success: false,
        });
      }

      if (
        "messagingTools" in updateFields &&
        !valvendorIdMessaging.includes(updateFields.messagingTools)
      ) {
        return res.status(400).json({
          message: "InvalvendorId messaging tool option",
          success: false,
        });
      }

      if (
        "prioritySupport" in updateFields &&
        !valvendorIdPrioritySupport.includes(updateFields.prioritySupport)
      ) {
        return res.status(400).json({
          message: "InvalvendorId priority support option",
          success: false,
        });
      }

      if ("payoutOptions" in updateFields) {
        const isValvendorIdPayoutArray =
          Array.isArray(updateFields.payoutOptions) &&
          updateFields.payoutOptions.length > 0 &&
          updateFields.payoutOptions.every((opt: string) =>
            valvendorIdPayoutOptions.includes(opt)
          );
        if (!isValvendorIdPayoutArray) {
          return res.status(400).json({
            message: "InvalvendorId payout options array",
            success: false,
          });
        }
      }

      // Perform update
      const updatedPlan = await SubscriptionPlan.findByIdAndUpdate(
        planId,
        updateFields,
        {
          new: true,
          runValvendorIdators: true,
        }
      );

      if (!updatedPlan) {
        return res
          .status(404)
          .json({ message: "Subscription plan not found", success: false });
      }

      return res.status(200).json({
        message: "Plan updated successfully",
        success: true,
        data: updatedPlan,
      });
    } catch (error: any) {
      console.error("UpdatePlan Error:", error.message);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async deletePlan(req: Request, res: Response) {
    try {
      const { planId } = req.params;
      const deletedPlan = await SubscriptionPlan.findByIdAndDelete(planId);
      if (!deletedPlan) {
        return res
          .status(404)
          .json({ message: "Subscription plan not found", success: false });
      }
      return res
        .status(203)
        .json({ message: "Plan deleted successfully", success: true });
    } catch (error: any) {
      console.error("DeletePlan Error:", error.message);
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

/**Vendor Management */

export class VenodrManagenentController {
  static async getAllVendors(req: Request, res: Response) {
    try {
      // Get query params for pagination
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const vendorsCount = await Vendor.countDocuments({});

      //  Paginate results
      const vendors = await Vendor.find({})
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }); // Optional: newest first

      res.status(200).json({
        success: true,
        message: "Vendors fetched successfully",
        data: {
          vendors,
          page,
          limit,
          totalPages: Math.ceil(vendorsCount / limit),
        },
      });
    } catch (err) {
      console.error("GetAllVendors Error:", err);
      res.status(500).json({
        message: "Error fetching vendors",
        success: false,
      });
    }
  }

  static async getVendorsStats(req: Request, res: Response) {
    try {
      //  Count statistics
      const totalApplications = await Vendor.countDocuments({});
      const pendingApplications = await Vendor.countDocuments({
        status: "pending",
      });
      const activeVendors = await Vendor.countDocuments({ status: "active" });
      const suspendedVendors = await Vendor.countDocuments({
        status: "suspended",
      });

      res.status(200).json({
        success: true,
        message: "Vendors fetched successfully",
        analytics: {
          totalApplications,
          pendingApplications,
          activeVendors,
          suspendedVendors,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Error fetching vendors' statistics",
        success: false,
      });
    }
  }

  static async getVendor(req: Request, res: Response) {
    try {
      const { vendorId } = req.params;

      const user = await User.find({
        vendorId,
      }).select("-password -__v");

      if (!user) {
        return res.status(404).json({
          message: "User not found",
          success: false,
        });
      }

      const vendor = await Vendor.findById(vendorId);
      if (!vendor) {
        return res.status(404).json({
          message: "Vendor not found",
          success: false,
        });
      }
      res.status(200).json({
        success: true,
        message: "Vendor fetched successfully",
        data: vendor,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Error fetching vendor",
        success: false,
      });
    }
  }

  static async getVendorProducts(req: Request, res: Response) {
    try {
      const { vendorId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const vendor = await Vendor.findById(vendorId);
      if (!vendor) {
        return res.status(404).json({
          message: "Vendor not found",
          success: false,
        });
      }

      // Paginate & select relevant fields
      const products = await Product.find({ vendorId: vendor._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: "category.main",
          select: "name",
        })
        .populate({
          path: "category.sub",
          select: "name",
        })
        .lean(); // allows for transformation

      // Enrich product with variant summary
      const enrichedProducts = products.map((product) => {
        let priceRange = null;
        let salePriceRange = null;
        let price = null;
        let stock = 0;
        let listingType = product.inventory?.listing?.type;

        if (listingType === "instant") {
          const prices: number[] = [];
          const salePrices: number[] = [];

          product.variants?.forEach((variant) => {
            variant.options?.forEach((option) => {
              stock += option.quantity;
              prices.push(option.price);
              if (option.salePrice !== undefined)
                salePrices.push(option.salePrice);
            });
          });

          priceRange = {
            min: Math.min(...prices),
            max: Math.max(...prices),
          };
          salePriceRange = salePrices.length
            ? {
                min: Math.min(...salePrices),
                max: Math.max(...salePrices),
              }
            : null;
        } else if (listingType === "auction") {
          const auction = product.inventory.listing.auction;
          stock = auction?.quantity || 0;
          price = auction?.reservePrice;
          return {
            _id: product._id,
            name: product.name,
            status: product.status,
            slug: product.slug,
            images: product.images,
            rating: product.rating,
            listingType,
            price,
            stock,
            purchases: product.analytics?.purchases || 0,
            category: product.category.sub || product.category.main,
          };
        }

        return {
          _id: product._id,
          name: product.name,
          status: product.status,
          slug: product.slug,
          images: product.images,
          rating: product.rating,
          listingType,
          priceRange,
          salePriceRange,
          stock,
          purchases: product.analytics?.purchases || 0,
          category: product.category.sub || product.category.main,
        };
      });

      const totalProducts = await Product.countDocuments({
        vendorId: vendor._id,
      });

      return res.status(200).json({
        success: true,
        message: "Vendor products fetched successfully",
        vendor: {
          _id: vendor._id,
          accountType: vendor.accountType,
          kycStatus: vendor.kycStatus,
          businessInfo: vendor.businessInfo,
          status: vendor.status,
        },
        pagination: {
          total: totalProducts,
          page,
          limit,
          totalPages: Math.ceil(totalProducts / limit),
        },
        products: enrichedProducts,
      });
    } catch (error: any) {
      console.error("getVendorProducts error:", error.message);
      res.status(500).json({
        message: "Error fetching vendor products",
        success: false,
      });
    }
  }

  static async getVendorOrders(req: Request, res: Response) {
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
            updatedAt: { $first: "$updatedAt" },
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
            updatedAt: 1,
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
      res.status(200).json({
        success: true,
        message: "Orders fetched successfully",
        orders,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  static async getTopSellingProducts(req: Request, res: Response) {
    try {
      const { vendorId } = req.params;
      const limit = parseInt(req.query.limit as string) || 5;

      const topProducts = await Product.aggregate([
        {
          $match: {
            vendorId: new mongoose.Types.ObjectId(vendorId),
            status: "active",
          },
        },
        {
          $project: {
            purchases: "$analytics.purchases",
          },
        },
        {
          $sort: { purchases: -1 }, // Top sellers first
        },
        {
          $limit: limit,
        },
      ]);

      res.status(200).json({
        success: true,
        message: `Top ${limit} selling products fetched for vendor`,
        data: topProducts,
      });
    } catch (error: any) {
      console.error("TopSellingProducts Error:", error.message);
      res.status(500).json({
        success: false,
        message: "Could not fetch top-selling products",
      });
    }
  }

  static async sendWarning(req: Request, res: Response) {
    try {
      const { type, message } = req.body;

      if (!type || !message) {
        return res.status(400).json({
          message: "Missing required fields",
          success: false,
        });
      }

      const { vendorId } = req.params;
      const vendor = await Vendor.findByIdAndUpdate(vendorId, {
        $push: { warnings: { type, message } },
      });
      if (!vendor) {
        return res.status(404).json({
          message: "Vendor not found",
          success: false,
        });
      }

      const user = await User.findById(vendor.userId);

      if (user) {
        await Promise.all([
          sendWarningEmail(
            user.email,
            user.businessName || user.profile.firstName,
            message
          ),
          Notification.create({
            userId: vendor.userId,
            type: "account-warning",
            case: "warning",
            data: {},
            title: "Compliance Warning",
            message,
          }),
        ]);
      }

      res.status(200).json({
        success: true,
        message: "Warning issued successfully",
      });
    } catch (error) {
      console.error("SendWarning Error:", error);
      res.status(500).json({
        message: "Error sending warning",
        success: false,
      });
    }
  }

  static async suspendVendor(req: Request, res: Response) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { vendorId } = req.params;
      let { reason, explanation, durationDays } = req.body;
      const enforcedBy = req.userId;

      if (!reason || !explanation || !durationDays || !enforcedBy) {
        return res.status(400).json({
          message: "Missing required fields",
          success: false,
        });
      }

      durationDays = parseInt(durationDays, 10);
      const resumeAt = new Date(
        Date.now() + durationDays * 24 * 60 * 60 * 1000
      );

      const vendor = await Vendor.findByIdAndUpdate(
        vendorId,
        {
          $set: {
            status: "suspended",
            suspension: {
              reason,
              explanation,
              suspendedAt: new Date(),
              resumeAt,
              enforcedBy,
            },
          },
        },
        { new: true, session }
      );

      if (!vendor) {
        await session.abortTransaction();
        return res.status(404).json({
          message: "Vendor not found",
          success: false,
        });
      }

      const user = await User.findById(vendor.userId).session(session);

      if (!user) {
        await session.abortTransaction();
        return res.status(404).json({
          message: "User not found",
          success: false,
        });
      }

      await sendSuspensionEmail(
        user.email,
        user.businessName || user.profile.firstName,
        explanation,
        reason,
        durationDays.toString()
      );

      await session.commitTransaction();

      // Log the suspension with admin details
      await AuditLogService.log(
        "VENDOR_SUSPENDED",
        "vendor",
        "warning",
        {
          vendorId,
          reason,
          suspendedBy: req.userId,
          previousStatus: "active",
          newStatus: "suspended",
        },
        req,
        vendorId
      );

      return res.status(200).json({
        success: true,
        message: "Vendor account suspended successfully",
        data: vendor,
      });
    } catch (error: any) {
      await session.abortTransaction();

      console.error("SuspendVendor Error:", error.message);
      return res.status(500).json({
        message: "Server error while suspending vendor",
        success: false,
      });
    } finally {
      session.endSession();
    }
  }

  static async unsuspendVendor(req: Request, res: Response) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { vendorId } = req.params;

      const vendor = await Vendor.findById(vendorId).session(session);

      if (!vendor) {
        await session.abortTransaction();
        return res.status(404).json({
          message: "Vendor not found",
          success: false,
        });
      }

      // Optional: Check if vendor is actually suspended
      if (vendor.status !== "suspended") {
        await session.abortTransaction();
        return res.status(400).json({
          message: "Vendor is not currently suspended",
          success: false,
        });
      }

      vendor.status = "active";
      const reason = vendor.suspension?.reason || "unspecified";
      const explanation = vendor.suspension?.explanation || "unspecified";
      vendor.suspension = undefined; // or null if preferred

      await vendor.save({ session });

      const user = await User.findById(vendor.userId).session(session);

      await session.commitTransaction();

      if (user) {
        await sendUnsuspensionEmail(
          user.email,
          user.businessName || user.profile.firstName,
          explanation,
          reason
        );
      }

      await AuditLogService.log(
        "VENDOR_REACTIVATED",
        "vendor",
        "info",
        {
          vendorId,
          reason,
          reactivatedBy: req.userId,
          previousStatus: "suspended",
          newStatus: "active",
        },
        req,
        vendorId
      );

      return res.status(200).json({
        success: true,
        message: "Vendor account unsuspended successfully",
        data: vendor,
      });
    } catch (error: any) {
      await session.abortTransaction();
      console.error("UnsuspendVendor Error:", error.message);
      return res.status(500).json({
        message: "Server error while unsuspending vendor",
        success: false,
      });
    } finally {
      session.endSession();
    }
  }

  static async getSuspendedVendors(req: Request, res: Response) {
    try {
      const {
        enforcedBy,
        resumeBefore,
        resumeAfter,
        page = 1,
        limit = 10,
      } = req.query;

      // Build dynamic query
      const query: any = { status: "suspended" };

      if (enforcedBy) {
        query["suspension.enforcedBy"] = enforcedBy;
      }

      if (resumeBefore || resumeAfter) {
        query["suspension.resumesAt"] = {};
        if (resumeBefore) {
          query["suspension.resumesAt"]["$lte"] = new Date(
            resumeBefore as string
          );
        }
        if (resumeAfter) {
          query["suspension.resumesAt"]["$gte"] = new Date(
            resumeAfter as string
          );
        }
      }

      const pageNum = Number(page);
      const limitNum = Number(limit);
      const skip = (pageNum - 1) * limitNum;

      const [suspendedVendors, total] = await Promise.all([
        Vendor.find(query)
          .populate(
            "suspension.enforcedBy",
            "email profile.firstName profile.lastName"
          )
          .select("userId status suspension businessInfo.name accountType")
          .sort({ "suspension.suspendedAt": -1 })
          .skip(skip)
          .limit(limitNum),
        Vendor.countDocuments(query),
      ]);

      return res.status(200).json({
        success: true,
        count: suspendedVendors.length,
        total,
        data: suspendedVendors,
        pagination: {
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
          hasNext: pageNum < Math.ceil(total / limitNum),
          hasPrev: pageNum > 1,
        },
      });
    } catch (error: any) {
      console.error("Error fetching suspended vendors:", error.message);
      return res.status(500).json({
        success: false,
        message: "Server error while fetching suspended vendors",
      });
    }
  }

  static async markItemInOrderAsReceived(req: Request, res: Response) {
    try {
      const { orderId } = req.params;
      const { productId, vendorId } = req.body;
      const receivedBy = req.userId;

      //  Validate input
      if (!productId || !vendorId || !receivedBy) {
        return res.status(400).json({
          success: false,
          message: "productId, vendorId, and receivedBy are required",
        });
      }

      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      const alreadyReceived = order.receivedItems?.some(
        (item) =>
          item.productId.toString() === productId &&
          item.vendorId.toString() === vendorId
      );
      if (alreadyReceived) {
        return res.status(409).json({
          success: false,
          message: "Product already marked as received for this vendor",
        });
      }

      // Get vendor and product details for notification
      const [vendor, product] = await Promise.all([
        Vendor.findById(vendorId).populate(
          "userId",
          "email businessName profile.firstName"
        ),
        Product.findById(productId).select("name"),
      ]);

      if (!vendor || !product) {
        return res.status(404).json({
          success: false,
          message: "Vendor or product not found",
        });
      }

      // Push received item
      order.receivedItems.push({
        productId: new mongoose.Types.ObjectId(productId),
        vendorId: new mongoose.Types.ObjectId(vendorId),
        receivedBy: new mongoose.Types.ObjectId(receivedBy),
      });

      await order.save();

      // Send notification email to vendor
      const vendorUser = vendor.userId as any;
      if (vendorUser?.email) {
        const vendorName =
          vendorUser.businessName || vendorUser.profile?.firstName || "Vendor";
        const receivedDate = new Date().toLocaleDateString();

        await sendItemReceivedEmail(
          vendorUser.email,
          vendorName,
          receivedDate,
          product.name,
          order._id.toString()
        );
      }

      // Send in-app notification
      await Notification.create({
        userId: vendor.userId,
        type: "order",
        case: "item-received",
        title: "Item Received at Warehouse",
        message: `Your product "${product.name}" from order ${order._id} has been received at our warehouse.`,
        data: {
          redirectUrl: `/vendor/orders/${order._id}`,
          entityId: order._id,
          entityType: "order",
        },
        isRead: false,
      });

      // Log the action
      await AuditLogService.log(
        "ITEM_MARKED_RECEIVED",
        "order",
        "info",
        {
          orderId,
          productId,
          vendorId,
          productName: product.name,
          receivedBy,
          vendorEmail: vendorUser?.email,
        },
        req,
        orderId
      );

      return res.status(200).json({
        success: true,
        message: "Product marked as received and vendor notified",
        data: order.receivedItems,
      });
    } catch (error: any) {
      console.error("markOrderAsReceived Error:", error.message);
      return res.status(500).json({
        success: false,
        message: "Server error while marking product as received",
      });
    }
  }

  static async rejectItemInOrderForVendor(req: Request, res: Response) {
    try {
      const { vendorId } = req.params;
      const { productId, orderId, reason, explanation } = req.body;
      const rejectedBy = req.userId;

      if (!productId || !orderId || !reason || !rejectedBy) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields for rejection",
        });
      }

      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      // Get vendor and product details for notification
      const [vendor, product] = await Promise.all([
        Vendor.findById(vendorId).populate(
          "userId",
          "email businessName profile.firstName"
        ),
        Product.findById(productId).select("name"),
      ]);

      if (!vendor || !product) {
        return res.status(404).json({
          success: false,
          message: "Vendor or product not found",
        });
      }

      const wasReceived = order.receivedItems?.some(
        (item) =>
          item.productId.toString() === productId &&
          item.vendorId.toString() === vendorId
      );

      if (!wasReceived) {
        return res.status(400).json({
          success: false,
          message: "Item has not been received at warehouse — cannot reject",
        });
      }

      // Prevent duplicates
      const alreadyRejected = order.rejectedItems?.some(
        (item) =>
          item.productId.toString() === productId &&
          item.vendorId.toString() === vendorId
      );
      if (alreadyRejected) {
        return res.status(409).json({
          success: false,
          message: "Item already rejected",
        });
      }

      order.rejectedItems.push({
        productId,
        vendorId: new mongoose.Types.ObjectId(vendorId),
        reason,
        explanation,
        rejectedBy,
        rejectedAt: new Date(),
      });

      // Send notification email to vendor
      const vendorUser = vendor.userId as any;
      if (vendorUser?.email) {
        const vendorName =
          vendorUser.businessName || vendorUser.profile?.firstName || "Vendor";
        const receivedDate = new Date().toLocaleDateString();

        await sendItemRejectionEmail(
          vendorUser.email,
          vendorName,
          explanation,
          reason,
          productId,
          order._id.toString()
        );
      }

      // Send in-app notification
      await Notification.create({
        userId: vendor.userId,
        type: "order",
        case: "item-rejected",
        title: "Item Rejected at Warehouse",
        message: `Your product "${product.name}" from order ${order._id} has been rejected at our warehouse.`,
        data: {
          redirectUrl: `/vendor/orders/${order._id}`,
          entityId: order._id,
          entityType: "order",
        },
        isRead: false,
      });

      // Log the action
      await AuditLogService.log(
        "ITEM_MARKED_REJECTED",
        "order",
        "info",
        {
          orderId,
          productId,
          vendorId,
          productName: product.name,
          receivedBy: req.userId,
          vendorEmail: vendorUser?.email,
        },
        req,
        orderId
      );

      await order.save();

      return res.status(200).json({
        success: true,
        message: "Item rejected successfully",
        data: order.rejectedItems,
      });
    } catch (error: any) {
      console.error("rejectItemInOrder Error:", error.message);
      return res.status(500).json({
        success: false,
        message: "Server error while rejecting item",
      });
    }
  }

  // Create admin controller
  static async createAdminController(req: Request, res: Response) {
    try {
      // 🛡️ Validate input using Joi
      const { error, value } = validateCreateAdmin(req.body);
      if (error) {
        const validationErrors = error.details.map((detail) => ({
          field: detail.path.join("."),
          message: detail.message,
        }));
        return res.status(400).json({
          message: "Validation failed",
          errors: validationErrors,
        });
      }

      const {
        firstName,
        lastName,
        email,
        phoneNumber,
        country,
        state,
        adminRole,
        permissions = [],
        enable2FA,
        profileImageUrl,
      } = value;

      // 🔐 Check if role exists
      const rolePermissions =
        ROLE_PERMISSIONS[adminRole as keyof typeof ROLE_PERMISSIONS];
      if (!rolePermissions) {
        return res.status(400).json({ message: "Invalid admin role" });
      }

      // Check if email already exists
      const existingUser = await UserModel.findOne({ email });
      if (existingUser) {
        return res.status(409).json({ message: "Email already exists" });
      }

      // 🧩 Merge role-based and custom permissions
      const finalPermissions = Array.from(
        new Set([...rolePermissions, ...permissions])
      );

      // 🔒 Hash default password or generate one
      const defaultPassword = generateRandomPassword();
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);

      // 📦 Create user
      const newAdmin: IUser = new UserModel({
        email,
        profile: {
          firstName,
          lastName,
          phoneNumber,
          avatar: profileImageUrl,
        },
        country,
        state,
        adminRole,
        permissions: finalPermissions,
        password: hashedPassword,
        role: "admin",
        status: "active",
        isEmailVerified: true,
        twoFactorAuth: {
          enabled: !!enable2FA,
        },
      });

      await newAdmin.save();

      // 📧 Send welcome email with credentials
      await sendAdminWelcomeEmail(email, firstName, defaultPassword, adminRole);

      // 🔐 Generate 2FA QR code if enabled
      let qrCodeUrl = null;
      if (enable2FA) {
        qrCodeUrl = await generateQRCode(newAdmin._id.toString(), email);
      }

      // 📝 Audit logging
      await AuditLogService.log(
        "ADMIN_CREATED",
        "admin",
        "info",
        {
          adminId: newAdmin._id,
          email,
          adminRole,
          permissions: finalPermissions,
          createdBy: req.userId,
          enable2FA: !!enable2FA,
        },
        req,
        newAdmin._id.toString()
      );

      return res.status(201).json({
        message: "Admin created successfully",
        adminId: newAdmin._id,
        qrCodeUrl,
      });
    } catch (error) {
      console.error("Error creating admin:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  static async suspendAdmin(req: Request, res: Response) {
    try {
      const { adminId } = req.params;

      const admin = await UserModel.findById(adminId);
      if (!admin || admin.role !== "admin") {
        return res.status(404).json({ message: "Admin not found" });
      }

      if (admin.status === "suspended") {
        return res.status(400).json({ message: "Admin is already suspended" });
      }

      admin.status = "suspended";
      await admin.save();

      await AuditLogService.log(
        "ADMIN_SUSPENDED",
        "admin",
        "warning",
        {
          adminId,
          suspendedBy: "Superadmin",
          superAdminId: req.userId,
        },
        req,
        adminId
      );

      return res.status(200).json({
        message: "Admin suspended successfully",
        data: { adminId, status: "suspended" },
      });
    } catch (error) {
      console.error("Error suspending admin:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  static async unsuspendAdmin(req: Request, res: Response) {
    try {
      const { adminId } = req.params;
      const unsuspendedBy = req.userId;

      const admin = await UserModel.findById(adminId);
      if (!admin || admin.role !== "admin") {
        return res.status(404).json({ message: "Admin not found" });
      }

      if (admin.status !== "suspended") {
        return res.status(400).json({ message: "Admin is not suspended" });
      }

      admin.status = "active";
      await admin.save();

      await AuditLogService.log(
        "ADMIN_UNSUSPENDED",
        "admin",
        "info",
        {
          adminId,
          unsuspendedBy,
          previousStatus: "suspended",
          newStatus: "active",
        },
        req,
        adminId
      );

      return res.status(200).json({
        message: "Admin unsuspended successfully",
        data: { adminId, status: "active" },
      });
    } catch (error) {
      console.error("Error unsuspending admin:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  static async changeAdminRole(req: Request, res: Response) {
    try {
      const { adminId } = req.params;
      const changedBy = req.userId;

      // 🛡️ Validate input
      const { error, value } = validateChangeRole(req.body);
      if (error) {
        const validationErrors = error.details.map((detail) => ({
          field: detail.path.join("."),
          message: detail.message,
        }));
        return res.status(400).json({
          message: "Validation failed",
          errors: validationErrors,
        });
      }

      const { newRole, permissions = [] } = value;

      const rolePermissions =
        ROLE_PERMISSIONS[newRole as keyof typeof ROLE_PERMISSIONS];
      if (!rolePermissions) {
        return res.status(400).json({ message: "Invalid admin role" });
      }

      const admin = await UserModel.findById(adminId);
      if (!admin || admin.role !== "admin") {
        return res.status(404).json({ message: "Admin not found" });
      }

      const oldRole = admin.adminRole;
      const finalPermissions = Array.from(
        new Set([...rolePermissions, ...permissions])
      );

      admin.adminRole = newRole;
      admin.permissions = finalPermissions;
      await admin.save();

      await AuditLogService.log(
        "ADMIN_ROLE_CHANGED",
        "admin",
        "info",
        {
          adminId,
          oldRole,
          newRole,
          permissions: finalPermissions,
          changedBy,
        },
        req,
        adminId
      );

      return res.status(200).json({
        message: "Admin role changed successfully",
        data: {
          adminId,
          oldRole,
          newRole,
          permissions: finalPermissions,
        },
      });
    } catch (error) {
      console.error("Error changing admin role:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  static async getAllAdmins(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10, status, role } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const query: any = { role: "admin" };
      if (status) query.status = status;
      if (role) query.adminRole = role;

      const [admins, total] = await Promise.all([
        UserModel.find(query)
          .select("-password -resetPasswordToken -verificationToken")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit)),
        UserModel.countDocuments(query),
      ]);

      return res.status(200).json({
        message: "Admins fetched successfully",
        data: {
          admins,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error) {
      console.error("Error fetching admins:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  static async getAdminLogs(req: Request, res: Response) {
    try {
      const { adminId } = req.params;
      const {
        page = 1,
        limit = 20,
        action,
        level,
        startDate,
        endDate,
      } = req.query;

      const admin = await UserModel.findById(adminId);
      if (!admin || admin.role !== "admin") {
        return res.status(404).json({ message: "Admin not found" });
      }

      const filters: any = { userId: adminId };
      if (action) filters.action = action;
      if (level) filters.level = level;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);

      const result = await AuditLogService.getAuditLogs(
        Number(page),
        Number(limit),
        filters
      );

      return res.status(200).json({
        message: "Admin logs fetched successfully",
        adminId,
        adminEmail: admin.email,
        adminRole: admin.adminRole,
        ...result,
      });
    } catch (error) {
      console.error("Error fetching admin logs:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // /**********************User Management */
  static async getAllUsers(req: Request, res: Response) {
    try {
      const users = await User.find({}).select(
        "profile email addresses status createdAt updatedAt"
      );
      if (!users) {
        return res.status(404).json({
          success: false,
          message: "No users found",
        });
      }
      const activeUserCount = await User.countDocuments({ status: "active" });
      res.status(200).json({
        success: true,
        message: "Users fetched successfully",
        data: {
          users,
          activeUserCount,
        },
      });
    } catch (error: any) {
      console.error("GetAllUsers Error:", error.message);
      res.status(500).json({
        success: false,
        message: "Server error while fetching users",
      });
    }
  }

  /**********************Order Management */
  static async getAllOrders(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10, status, startDate, endDate } = req.query;
      const query: any = {};
      if (status) query.status = status;
      if (startDate) query.createdAt = { $gte: new Date(startDate as string) };
      if (endDate) {
        query.createdAt = query.createdAt || {};
        query.createdAt.$lte = new Date(endDate as string);
      }
      const skip = (Number(page) - 1) * Number(limit);

      const [orders, total] = await Promise.all([
        Order.find(query)
          .populate("userId", "email profile.firstName profile.lastName")
          .populate({
            path: "items.productId",
            select: "name image vendorId",
            populate: { path: "vendorId", select: "businessInfo.name" },
          })
          .populate(
            "paymentId",
            "amount currency method status transactionId gateway"
          )
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit)),
        Order.countDocuments(query),
      ]);
      res.status(200).json({
        success: true,
        message: "Orders fetched successfully",
        data: {
          orders,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error: any) {
      console.error("GetAllOrders Error:", error.message);
      res.status(500).json({
        success: false,
        message: "Server error while fetching orders",
      });
    }
  }

  // Admin order stats
  static async getOrderStats(req: Request, res: Response) {
    try {
      const stats = await Order.aggregate([
        {
          $facet: {
            totalOrders: [{ $count: "count" }],

            ordersByStatus: [
              {
                $group: {
                  _id: "$status",
                  count: { $sum: 1 },
                },
              },
            ],

            ordersByPaymentMethod: [
              {
                $group: {
                  _id: "$paymentMethod",
                  count: { $sum: 1 },
                },
              },
            ],

            ordersByPaymentStatus: [
              {
                $group: {
                  _id: "$paymentStatus",
                  count: { $sum: 1 },
                },
              },
            ],

            totalRevenue: [
              {
                $unwind: "$items",
              },
              {
                $group: {
                  _id: null,
                  revenue: {
                    $sum: {
                      $multiply: ["$items.price", "$items.quantity"],
                    },
                  },
                },
              },
            ],

            cancelledOrders: [
              {
                $match: { status: "cancelled" },
              },
              {
                $count: "count",
              },
            ],

            averageOrderValue: [
              {
                $unwind: "$items",
              },
              {
                $group: {
                  _id: "$_id",
                  orderTotal: {
                    $sum: {
                      $multiply: ["$items.price", "$items.quantity"],
                    },
                  },
                },
              },
              {
                $group: {
                  _id: null,
                  averageValue: { $avg: "$orderTotal" },
                },
              },
            ],
          },
        },
      ]);

      const refundStats = await Payment.aggregate([
        {
          $match: {
            status: "refunded",
            "refundDetails.amount": { $gt: 0 },
          },
        },
        {
          $group: {
            _id: "$refundDetails.status",
            totalRefunds: { $sum: 1 },
            totalRefundedAmount: { $sum: "$refundDetails.amount" },
          },
        },
      ]);

      res.status(200).json({
        success: true,
        message: "Order stats fetched successfully",
        data: {
          ...stats[0],
          refunds: refundStats,
        },
      });
    } catch (error: any) {
      console.error("GetOrderStats Error:", error.message);
      res.status(500).json({
        success: false,
        message: "Server error while fetching order stats",
      });
    }
  }

  //  Admin logistics

  //Logistics stats
  static async getShippingStats(req: Request, res: Response) {
    try {
      const stats = await Order.aggregate([
        {
          $group: {
            _id: "$shipping.status",
            count: { $sum: 1 },
          },
        },
      ]);

      // Format the result into a more readable object
      const formattedStats = {
        pending: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
        refunded: 0,
        confirmed: 0,
        shippedToWarehouse: 0,
      };

      stats.forEach((entry) => {
        const status = entry._id || "unknown";
        formattedStats[status as keyof typeof formattedStats] = entry.count;
      });

      res.status(200).json({
        success: true,
        message: "Shipping status stats fetched successfully",
        data: formattedStats,
      });
    } catch (error: any) {
      console.error("ShippingStats Error:", error.message);
      res.status(500).json({
        success: false,
        message: "Server error while fetching shipping stats",
      });
    }
  }

  static async updateShippingStatus(req: Request, res: Response) {
    try {
      const { orderId } = req.params;
      const { status, carrier, estimatedDelivery } = req.body;
      const updatedBy = req.userId;
      if (!status || !updatedBy) {
        return res.status(400).json({
          success: false,
          message: "status or admin user not provided",
        });
      }

      const order = await Order.findByIdAndUpdate(
        orderId,
        {
          $set: {
            "shipping.status": status,
            "shipping.carrier": carrier,
            "shipping.estimatedDelivery": estimatedDelivery,
            "shipping.updatedBy": updatedBy,
            "shipping.updatedAt": new Date(),
          },
        },
        { new: true }
      );
      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }
      return res.status(200).json({
        success: true,
        message: "Shipping status updated successfully",
        data: order.shipping,
      });
    } catch (error: any) {
      console.error("UpdateShippingStatus Error:", error.message);
      res.status(500).json({
        success: false,
        message: "Server error while updating shipping status",
      });
    }
  }

  // Configurations
  /**********************Category management */
  static async getCategoriesStats(req: Request, res: Response) {
    try {
      const stats = await CategoryModel.aggregate([
        {
          $facet: {
            totalCategories: [{ $count: "count" }],

            subCategories: [
              { $match: { parent: { $ne: null } } },
              { $count: "count" },
            ],

            activeCategories: [
              { $match: { isActive: true } },
              { $count: "count" },
            ],

            disabledCategories: [
              { $match: { isActive: false } },
              { $count: "count" },
            ],
          },
        },
      ]);

      const result = {
        totalCategories: stats[0].totalCategories[0]?.count || 0,
        subCategories: stats[0].subCategories[0]?.count || 0,
        activeCategories: stats[0].activeCategories[0]?.count || 0,
        disabledCategories: stats[0].disabledCategories[0]?.count || 0,
      };

      res.status(200).json({
        success: true,
        message: "Category stats fetched successfully",
        data: result,
      });
    } catch (error: any) {
      console.error("getCategoriesStats Error:", error.message);
      res.status(500).json({
        success: false,
        message: "Server error while fetching category stats",
      });
    }
  }

  static async disableCategory(req: Request, res: Response) {
    try {
      const { categoryId } = req.params;
      const { isActive } = req.body;
      const updatedBy = req.userId;
      if (isActive === undefined || !updatedBy) {
        return res.status(400).json({
          success: false,
          message: "isActive or admin user not provided",
          data: null,
        });
      }

      const category = await CategoryModel.findByIdAndUpdate(
        categoryId,
        {
          $set: {
            isActive,
            updatedBy,
            updatedAt: new Date(),
          },
        },
        { new: true }
      );
      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Category not found",
          data: null,
        });
      }
      return res.status(200).json({
        success: true,
        message: "Category updated successfully",
        data: category,
      });
    } catch (error: any) {
      console.error("DisableCategory Error:", error.message);
      res.status(500).json({
        success: false,
        message: "Server error while updating category",
      });
    }
  }


  // Reports
  /****Order and Transaction Reports */
  static async generateOrderReport(req: Request, res: Response) {
    try {
      const {
        timeframe,
        format = "json",
        status,
        paymentMethod,
        category,
        page = 1,
        limit = 5,
      } = req.query;

      const dateRange = VenodrManagenentController.getDateRange(
        timeframe as string
      );

      const query: any = {};
      if (dateRange.start) query.createdAt = { $gte: dateRange.start };
      if (dateRange.end) {
        query.createdAt = query.createdAt || {};
        query.createdAt.$lte = dateRange.end;
      }
      if (status) query.status = status;

      const [orders, paymentStats, topItems, categoryStats] = await Promise.all(
        [
          Order.find(query)
            .sort({ createdAt: -1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit))
            .populate("userId", "email profile.firstName profile.lastName")
            .populate({
              path: "items.productId",
              select: "name image vendorId",
              populate: {
                path: "vendorId",
                select: "businessInfo.name",
              },
            })
            .populate(
              "paymentId",
              "amount currency method status transactionId gateway"
            ),
          VenodrManagenentController.getPaymentMethodStats(query),
          VenodrManagenentController.getTopSellingItems(query, 10),
          VenodrManagenentController.getCategoryStats(query),
        ]
      );

      const reportData = {
        summary: {
          totalOrders: orders.length,
          totalRevenue: orders.reduce(
            (sum, order) =>
              sum +
              order.items.reduce(
                (itemSum, item) => itemSum + item.price * item.quantity,
                0
              ),
            0
          ),
          timeframe: timeframe || "custom",
          generatedAt: new Date(),
        },
        paymentMethodStats: paymentStats,
        topSellingItems: topItems,
        categoryBreakdown: categoryStats,
        orders: orders,
      };

      if (format === "csv") {
        const csvData =
          VenodrManagenentController.convertOrdersToCSV(reportData);
        res.header("Content-Type", "text/csv");
        res.attachment(`order_report_${timeframe || "custom"}.csv`);
        return res.send(csvData);
      }

      if (format === "pdf") {
        const pdfBuffer = await VenodrManagenentController.generatePDFReport(
          reportData
        );
        res.header("Content-Type", "application/pdf");
        res.attachment(`order_report_${timeframe || "custom"}.pdf`);
        return res.send(pdfBuffer);
      }

      res.status(200).json({
        success: true,
        message: "Order report generated successfully",
        data: reportData,
      });
    } catch (error: any) {
      console.error("GenerateOrderReport Error:", error.message);
      res.status(500).json({
        success: false,
        message: "Server error while generating order report",
      });
    }
  }

  private static getDateRange(timeframe: string) {
    const now = new Date();
    const ranges: { [key: string]: { start: Date; end: Date } } = {
      this_week: {
        start: new Date(now.setDate(now.getDate() - now.getDay())),
        end: new Date(),
      },
      last_7_days: {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        end: new Date(),
      },
      last_30_days: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date(),
      },
      last_6_months: {
        start: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000),
        end: new Date(),
      },
      last_year: {
        start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        end: new Date(),
      },
    };
    return ranges[timeframe] || { start: null, end: null };
  }

  private static async getPaymentMethodStats(query: any) {
    const payments = await Payment.aggregate([
      {
        $lookup: {
          from: "orders",
          localField: "_id",
          foreignField: "paymentId",
          as: "order",
        },
      },
      { $unwind: "$order" },
      { $match: { "order.createdAt": query.createdAt } },
      {
        $group: {
          _id: "$method",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
      { $project: { method: "$_id", count: 1, totalAmount: 1, _id: 0 } },
    ]);

    const total = payments.reduce((sum, p) => sum + p.count, 0);
    return payments.map((p) => ({
      ...p,
      percentage: ((p.count / total) * 100).toFixed(2),
    }));
  }

  private static async getTopSellingItems(query: any, limit: number = 10) {
    return await Order.aggregate([
      { $match: query },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          totalSold: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      { $project: { productName: "$product.name", totalSold: 1, revenue: 1 } },
      { $sort: { totalSold: -1 } },
      { $limit: limit },
    ]);
  }

  private static async getCategoryStats(query: any) {
    return await Order.aggregate([
      { $match: query },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.productId",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $group: {
          _id: "$product.category",
          count: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "categoryInfo",
        },
      },
      { $unwind: "$categoryInfo" },
      {
        $project: { categoryName: "$categoryInfo.name", count: 1, revenue: 1 },
      },
      { $sort: { revenue: -1 } },
    ]);
  }

  private static convertOrdersToCSV(reportData: any): string {
    const headers = [
      "Order ID",
      "Date",
      "Status",
      "Payment Method",
      "Total Amount",
      "Items Count",
    ];
    const rows = reportData.orders.map((order: any) => [
      order._id,
      order.createdAt.toISOString().split("T")[0],
      order.status,
      order.paymentId?.method || "N/A",
      order.items.reduce(
        (sum: number, item: any) => sum + item.price * item.quantity,
        0
      ),
      order.items.length,
    ]);

    const summaryRows = [
      ["SUMMARY"],
      ["Total Orders", reportData.summary.totalOrders],
      ["Total Revenue", reportData.summary.totalRevenue],
      [""],
      ["PAYMENT METHOD BREAKDOWN"],
      ...reportData.paymentMethodStats.map((stat: any) => [
        stat.method,
        `${stat.percentage}%`,
        stat.count,
        stat.totalAmount,
      ]),
      [""],
      ["TOP SELLING ITEMS"],
      ...reportData.topSellingItems.map((item: any) => [
        item.productName,
        item.totalSold,
        item.revenue,
      ]),
    ];

    return [
      headers.join(","),
      ...rows.map((row: any) => row.join(",")),
      "",
      ...summaryRows.map((row) => row.join(",")),
    ].join("\n");
  }

  private static async generatePDFReport(reportData: any): Promise<Buffer> {
    const PDFDocument = require("pdfkit");
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));

    doc.fontSize(20).text("Order Report", 50, 50);
    doc
      .fontSize(12)
      .text(
        `Generated: ${reportData.summary.generatedAt.toLocaleDateString()}`,
        50,
        80
      );
    doc.text(`Timeframe: ${reportData.summary.timeframe}`, 50, 100);

    doc.fontSize(16).text("Summary", 50, 140);
    doc
      .fontSize(12)
      .text(`Total Orders: ${reportData.summary.totalOrders}`, 50, 170)
      .text(
        `Total Revenue: $${reportData.summary.totalRevenue.toFixed(2)}`,
        50,
        190
      );

    doc.fontSize(16).text("Payment Method Breakdown", 50, 230);
    let yPos = 260;
    reportData.paymentMethodStats.forEach((stat: any) => {
      doc
        .fontSize(12)
        .text(
          `${stat.method}: ${stat.percentage}% (${stat.count} orders)`,
          50,
          yPos
        );
      yPos += 20;
    });

    yPos += 20;
    doc.fontSize(16).text("Top Selling Items", 50, yPos);
    yPos += 30;
    reportData.topSellingItems.slice(0, 5).forEach((item: any) => {
      doc
        .fontSize(12)
        .text(
          `${item.productName}: ${item.totalSold} sold ($${item.revenue.toFixed(
            2
          )})`,
          50,
          yPos
        );
      yPos += 20;
    });

    doc.end();

    return new Promise((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
    });
  }

  static async getListingStats(req: Request, res: Response) {
    try {
      const {
        timeframe,
        format = "json",
        status,
        condition,
        category,
        page = 1,
        limit = 10,
      } = req.query;

      const dateRange = VenodrManagenentController.getDateRange(
        timeframe as string
      );

      const query: any = {};
      if (dateRange.start) query.createdAt = { $gte: dateRange.start };
      if (dateRange.end) {
        query.createdAt = query.createdAt || {};
        query.createdAt.$lte = dateRange.end;
      }
      if (status) query.status = status;
      if (condition) query.condition = condition;
      if (category) query.category = category;

      const [listings, statusStats, monthlyStats, typeStats] =
        await Promise.all([
          Product.find(query)
            .sort({ createdAt: -1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit))
            .populate("vendorId", "businessInfo.name")
            .populate("category.main category.sub", "name"),
          VenodrManagenentController.getListingStatusStats(query),
          VenodrManagenentController.getMonthlyListingStats(query),
          VenodrManagenentController.getListingTypeBreakdown(query),
        ]);

      const reportData = {
        summary: {
          totalListings: typeStats.totalListings,
          auctionListings: typeStats.auctionListings,
          instantListings: typeStats.instantListings,
          timeframe: timeframe || "custom",
          generatedAt: new Date(),
        },
        statusBreakdown: statusStats,
        monthlyTrends: monthlyStats,
        typeBreakdown: typeStats,
        listings: listings,
      };

      if (format === "csv") {
        const csvData =
          VenodrManagenentController.convertListingsToCSV(reportData);
        res.header("Content-Type", "text/csv");
        res.attachment(`listing_report_${timeframe || "custom"}.csv`);
        return res.send(csvData);
      }

      if (format === "pdf") {
        const pdfBuffer =
          await VenodrManagenentController.generateListingPDFReport(reportData);
        res.header("Content-Type", "application/pdf");
        res.attachment(`listing_report_${timeframe || "custom"}.pdf`);
        return res.send(pdfBuffer);
      }

      res.status(200).json({
        success: true,
        message: "Listing stats generated successfully",
        data: reportData,
      });
    } catch (error: any) {
      console.error("GetListingStats Error:", error.message);
      res.status(500).json({
        success: false,
        message: "Server error while fetching listing stats",
      });
    }
  }

  private static async getListingStatusStats(query: any) {
    const stats = await Product.aggregate([
      { $match: query },
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $project: { status: "$_id", count: 1, _id: 0 } },
    ]);

    const total = stats.reduce((sum, s) => sum + s.count, 0);
    const statusMap = { failed: 0, successful: 0, pending: 0 };

    stats.forEach((s) => {
      if (s.status in statusMap) {
        statusMap[s.status as keyof typeof statusMap] = s.count;
      }
    });

    return {
      failed: {
        count: statusMap.failed,
        percentage: ((statusMap.failed / total) * 100).toFixed(2),
      },
      successful: {
        count: statusMap.successful,
        percentage: ((statusMap.successful / total) * 100).toFixed(2),
      },
      pending: {
        count: statusMap.pending,
        percentage: ((statusMap.pending / total) * 100).toFixed(2),
      },
    };
  }

  private static async getMonthlyListingStats(query: any) {
    return await Product.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
            type: "$inventory.listing.type",
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: { month: "$_id.month", year: "$_id.year" },
          instant: {
            $sum: { $cond: [{ $eq: ["$_id.type", "instant"] }, "$count", 0] },
          },
          auction: {
            $sum: { $cond: [{ $eq: ["$_id.type", "auction"] }, "$count", 0] },
          },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);
  }

  private static async getListingTypeBreakdown(query: any) {
    const stats = await Product.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$inventory.listing.type",
          count: { $sum: 1 },
        },
      },
    ]);

    const totalListings = stats.reduce((sum, s) => sum + s.count, 0);
    const auctionListings = stats.find((s) => s._id === "auction")?.count || 0;
    const instantListings = stats.find((s) => s._id === "instant")?.count || 0;

    return { totalListings, auctionListings, instantListings };
  }

  private static convertListingsToCSV(reportData: any): string {
    const headers = [
      "Listing ID",
      "Name",
      "Type",
      "Status",
      "Condition",
      "Created Date",
      "Vendor",
    ];
    const rows = reportData.listings.map((listing: any) => [
      listing._id,
      listing.name,
      listing.inventory?.listing?.type || "N/A",
      listing.status,
      listing.condition,
      listing.createdAt.toISOString().split("T")[0],
      listing.vendorId?.businessInfo?.name || "N/A",
    ]);

    const summaryRows = [
      ["SUMMARY"],
      ["Total Listings", reportData.summary.totalListings],
      ["Auction Listings", reportData.summary.auctionListings],
      ["Instant Listings", reportData.summary.instantListings],
      [""],
      ["STATUS BREAKDOWN"],
      [
        "Failed",
        `${reportData.statusBreakdown.failed.percentage}%`,
        reportData.statusBreakdown.failed.count,
      ],
      [
        "Successful",
        `${reportData.statusBreakdown.successful.percentage}%`,
        reportData.statusBreakdown.successful.count,
      ],
      [
        "Pending",
        `${reportData.statusBreakdown.pending.percentage}%`,
        reportData.statusBreakdown.pending.count,
      ],
    ];

    return [
      headers.join(","),
      ...rows.map((row: any) => row.join(",")),
      "",
      ...summaryRows.map((row) => row.join(",")),
    ].join("\n");
  }

  private static async generateListingPDFReport(
    reportData: any
  ): Promise<Buffer> {
    const PDFDocument = require("pdfkit");
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));

    doc.fontSize(20).text("Listing Report", 50, 50);
    doc
      .fontSize(12)
      .text(
        `Generated: ${reportData.summary.generatedAt.toLocaleDateString()}`,
        50,
        80
      );
    doc.text(`Timeframe: ${reportData.summary.timeframe}`, 50, 100);

    doc.fontSize(16).text("Summary", 50, 140);
    doc
      .fontSize(12)
      .text(`Total Listings: ${reportData.summary.totalListings}`, 50, 170)
      .text(`Auction Listings: ${reportData.summary.auctionListings}`, 50, 190)
      .text(`Instant Listings: ${reportData.summary.instantListings}`, 50, 210);

    doc.fontSize(16).text("Status Breakdown", 50, 250);
    let yPos = 280;
    Object.entries(reportData.statusBreakdown).forEach(
      ([status, data]: [string, any]) => {
        doc
          .fontSize(12)
          .text(
            `${status}: ${data.percentage}% (${data.count} listings)`,
            50,
            yPos
          );
        yPos += 20;
      }
    );

    doc.end();

    return new Promise((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
    });
  }

  static async getUserStats(req: Request, res: Response) {
    try {
      const {
        timeframe,
        format = "json",
        userType = "personal",
        country,
        status,
        onboarded,
        page = 1,
        limit = 10,
      } = req.query;

      const dateRange = VenodrManagenentController.getDateRange(
        timeframe as string
      );

      const query: any = {};
      if (dateRange.start) query.createdAt = { $gte: dateRange.start };
      if (dateRange.end) {
        query.createdAt = query.createdAt || {};
        query.createdAt.$lte = dateRange.end;
      }
      if (userType) query.role = userType;
      if (country) query.country = country;
      if (status) query.status = status;
      if (onboarded !== undefined) query.isEmailVerified = onboarded === "true";

      const [users, typeStats, monthlyStats, statusStats] = await Promise.all([
        User.find(query)
          .sort({ createdAt: -1 })
          .skip((Number(page) - 1) * Number(limit))
          .limit(Number(limit))
          .populate("country", "name currency")
          .select("-password -resetPasswordToken -verificationToken"),
        VenodrManagenentController.getUserTypeBreakdown(query),
        VenodrManagenentController.getMonthlyUserStats(query),
        VenodrManagenentController.getUserStatusStats(query),
      ]);

      const usersWithActivity =
        await VenodrManagenentController.getUserRecentActivities(users);

      const reportData = {
        summary: {
          totalUsers: typeStats.totalUsers,
          regularUsers: typeStats.regularUsers,
          vendors: typeStats.vendors,
          admins: typeStats.admins,
          timeframe: timeframe || "custom",
          generatedAt: new Date(),
        },
        typeBreakdown: typeStats,
        monthlyTrends: monthlyStats,
        statusBreakdown: statusStats,
        users: usersWithActivity,
      };

      if (format === "csv") {
        const csvData =
          VenodrManagenentController.convertUsersToCSV(reportData);
        res.header("Content-Type", "text/csv");
        res.attachment(`user_report_${timeframe || "custom"}.csv`);
        return res.send(csvData);
      }

      if (format === "pdf") {
        const pdfBuffer =
          await VenodrManagenentController.generateUserPDFReport(reportData);
        res.header("Content-Type", "application/pdf");
        res.attachment(`user_report_${timeframe || "custom"}.pdf`);
        return res.send(pdfBuffer);
      }

      console.log(reportData);

      res.status(200).json({
        success: true,
        message: "User stats generated successfully",
        data: reportData,
      });
    } catch (error: any) {
      console.error("GetUserStats Error:", error.message);
      res.status(500).json({
        success: false,
        message: "Server error while fetching user stats",
      });
    }
  }

  private static async getUserTypeBreakdown(query: any) {
    const stats = await User.aggregate([
      { $match: query },
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]);

    const totalUsers = stats.reduce((sum, s) => sum + s.count, 0);
    const regularUsers = stats.find((s) => s._id === "personal")?.count || 0;
    const vendors = stats.find((s) => s._id === "business")?.count || 0;
    const admins = stats.find((s) => s._id === "admin")?.count || 0;

    return { totalUsers, regularUsers, vendors, admins };
  }

  private static async getMonthlyUserStats(query: any) {
    return await User.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
            role: "$role",
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: { month: "$_id.month", year: "$_id.year" },
          users: {
            $sum: { $cond: [{ $eq: ["$_id.role", "user"] }, "$count", 0] },
          },
          vendors: {
            $sum: { $cond: [{ $eq: ["$_id.role", "vendor"] }, "$count", 0] },
          },
          admins: {
            $sum: { $cond: [{ $eq: ["$_id.role", "admin"] }, "$count", 0] },
          },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);
  }

  private static async getUserStatusStats(query: any) {
    const stats = await User.aggregate([
      { $match: query },
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $project: { status: "$_id", count: 1, _id: 0 } },
    ]);

    const total = stats.reduce((sum, s) => sum + s.count, 0);
    return stats.map((s) => ({
      ...s,
      percentage: ((s.count / total) * 100).toFixed(2),
    }));
  }

  private static async getUserRecentActivities(users: any[]) {
    const usersWithActivity = await Promise.all(
      users.map(async (user) => {
        const recentActivity = await AuditLog.findOne({ userId: user._id })
          .sort({ timestamp: -1 })
          .select("action timestamp resource level");

        return {
          ...user.toObject(),
          lastActivity: recentActivity
            ? {
                action: recentActivity.action,
                timestamp: recentActivity.timestamp,
                resource: recentActivity.resource,
                level: recentActivity.level,
              }
            : null,
        };
      })
    );

    return usersWithActivity;
  }

  private static convertUsersToCSV(reportData: any): string {
    const headers = [
      "User ID",
      "Email",
      "Name",
      "Role",
      "Status",
      "Country",
      "Onboarded",
      "Created Date",
      "Last Activity",
    ];
    const rows = reportData.users.map((user: any) => [
      user._id,
      user.email,
      `${user.profile?.firstName || ""} ${user.profile?.lastName || ""}`.trim(),
      user.role,
      user.status,
      user.country?.name || "N/A",
      user.isEmailVerified ? "Yes" : "No",
      user.createdAt.toISOString().split("T")[0],
      user.lastActivity
        ? user.lastActivity.timestamp.toISOString().split("T")[0]
        : "N/A",
    ]);

    const summaryRows = [
      ["SUMMARY"],
      ["Total Users", reportData.summary.totalUsers],
      ["Regular Users", reportData.summary.regularUsers],
      ["Vendors", reportData.summary.vendors],
      ["Admins", reportData.summary.admins],
      [""],
      ["STATUS BREAKDOWN"],
      ...reportData.statusBreakdown.map((stat: any) => [
        stat.status,
        `${stat.percentage}%`,
        stat.count,
      ]),
    ];

    return [
      headers.join(","),
      ...rows.map((row: any) => row.join(",")),
      "",
      ...summaryRows.map((row) => row.join(",")),
    ].join("\n");
  }

  private static async generateUserPDFReport(reportData: any): Promise<Buffer> {
    const PDFDocument = require("pdfkit");
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));

    doc.fontSize(20).text("User Report", 50, 50);
    doc
      .fontSize(12)
      .text(
        `Generated: ${reportData.summary.generatedAt.toLocaleDateString()}`,
        50,
        80
      );
    doc.text(`Timeframe: ${reportData.summary.timeframe}`, 50, 100);

    doc.fontSize(16).text("Summary", 50, 140);
    doc
      .fontSize(12)
      .text(`Total Users: ${reportData.summary.totalUsers}`, 50, 170)
      .text(`Regular Users: ${reportData.summary.regularUsers}`, 50, 190)
      .text(`Vendors: ${reportData.summary.vendors}`, 50, 210)
      .text(`Admins: ${reportData.summary.admins}`, 50, 230);

    doc.fontSize(16).text("Status Breakdown", 50, 270);
    let yPos = 300;
    reportData.statusBreakdown.forEach((stat: any) => {
      doc
        .fontSize(12)
        .text(
          `${stat.status}: ${stat.percentage}% (${stat.count} users)`,
          50,
          yPos
        );
      yPos += 20;
    });

    doc.end();

    return new Promise((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
    });
  }

  static async getLogistics(req: Request, res: Response) {
    try {
      const {
        timeframe,
        format = "json",
        shippingType,
        status,
        page = 1,
        limit = 10,
      } = req.query;

      const dateRange = VenodrManagenentController.getDateRange(
        timeframe as string
      );

      const query: any = {};
      if (dateRange.start) query.createdAt = { $gte: dateRange.start };
      if (dateRange.end) {
        query.createdAt = query.createdAt || {};
        query.createdAt.$lte = dateRange.end;
      }
      if (shippingType) query["shipping.type"] = shippingType;
      if (status) query["shipping.status"] = status;

      const [orders, shippingStats, typeStats] = await Promise.all([
        Order.find(query)
          .sort({ createdAt: -1 })
          .skip((Number(page) - 1) * Number(limit))
          .limit(Number(limit))
          .populate("userId", "email profile.firstName profile.lastName")
          .populate("items.productId", "name images")
          .select("_id userId items shipping status createdAt"),
        VenodrManagenentController.getShippingStatusStats(query),
        VenodrManagenentController.getShippingTypeStats(query),
      ]);

      const reportData = {
        summary: {
          totalOrders: orders.length,
          timeframe: timeframe || "custom",
          generatedAt: new Date(),
        },
        shippingStatusBreakdown: shippingStats,
        shippingTypeBreakdown: typeStats,
        orders: orders,
      };

      if (format === "csv") {
        const csvData =
          VenodrManagenentController.convertLogisticsToCSV(reportData);
        res.header("Content-Type", "text/csv");
        res.attachment(`logistics_report_${timeframe || "custom"}.csv`);
        return res.send(csvData);
      }

      if (format === "pdf") {
        const pdfBuffer =
          await VenodrManagenentController.generateLogisticsPDFReport(
            reportData
          );
        res.header("Content-Type", "application/pdf");
        res.attachment(`logistics_report_${timeframe || "custom"}.pdf`);
        return res.send(pdfBuffer);
      }

      res.status(200).json({
        success: true,
        message: "Logistics report generated successfully",
        data: reportData,
      });
    } catch (error: any) {
      console.error("GetLogistics Error:", error.message);
      res.status(500).json({
        success: false,
        message: "Server error while fetching logistics data",
      });
    }
  }

  private static async getShippingStatusStats(query: any) {
    const stats = await Order.aggregate([
      { $match: query },
      { $group: { _id: "$shipping.status", count: { $sum: 1 } } },
      { $project: { status: "$_id", count: 1, _id: 0 } },
    ]);

    const total = stats.reduce((sum, s) => sum + s.count, 0);
    return stats.map((s) => ({
      ...s,
      percentage: ((s.count / total) * 100).toFixed(2),
    }));
  }

  private static async getShippingTypeStats(query: any) {
    const stats = await Order.aggregate([
      { $match: query },
      { $group: { _id: "$shipping.type", count: { $sum: 1 } } },
      { $project: { type: "$_id", count: 1, _id: 0 } },
    ]);

    const total = stats.reduce((sum, s) => sum + s.count, 0);
    return stats.map((s) => ({
      ...s,
      percentage: ((s.count / total) * 100).toFixed(2),
    }));
  }

  private static convertLogisticsToCSV(reportData: any): string {
    const headers = [
      "Order ID",
      "Buyer Email",
      "Buyer Name",
      "Products",
      "Shipping Status",
      "Shipping Type",
      "Carrier",
      "Tracking Number",
      "Created Date",
    ];
    const rows = reportData.orders.map((order: any) => [
      order._id,
      order.userId?.email || "N/A",
      `${order.userId?.profile?.firstName || ""} ${
        order.userId?.profile?.lastName || ""
      }`.trim() || "N/A",
      order.items?.map((item: any) => item.productId?.name).join("; ") || "N/A",
      order.shipping?.status || "N/A",
      order.shipping?.type || "N/A",
      order.shipping?.carrier || "N/A",
      order.shipping?.trackingNumber || "N/A",
      order.createdAt.toISOString().split("T")[0],
    ]);

    const summaryRows = [
      ["SUMMARY"],
      ["Total Orders", reportData.summary.totalOrders],
      [""],
      ["SHIPPING STATUS BREAKDOWN"],
      ...reportData.shippingStatusBreakdown.map((stat: any) => [
        stat.status,
        `${stat.percentage}%`,
        stat.count,
      ]),
      [""],
      ["SHIPPING TYPE BREAKDOWN"],
      ...reportData.shippingTypeBreakdown.map((stat: any) => [
        stat.type,
        `${stat.percentage}%`,
        stat.count,
      ]),
    ];

    return [
      headers.join(","),
      ...rows.map((row: any) => row.join(",")),
      "",
      ...summaryRows.map((row) => row.join(",")),
    ].join("\n");
  }

  private static async generateLogisticsPDFReport(
    reportData: any
  ): Promise<Buffer> {
    const PDFDocument = require("pdfkit");
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));

    doc.fontSize(20).text("Logistics Report", 50, 50);
    doc
      .fontSize(12)
      .text(
        `Generated: ${reportData.summary.generatedAt.toLocaleDateString()}`,
        50,
        80
      );
    doc.text(`Timeframe: ${reportData.summary.timeframe}`, 50, 100);

    doc.fontSize(16).text("Summary", 50, 140);
    doc
      .fontSize(12)
      .text(`Total Orders: ${reportData.summary.totalOrders}`, 50, 170);

    doc.fontSize(16).text("Shipping Status Breakdown", 50, 210);
    let yPos = 240;
    reportData.shippingStatusBreakdown.forEach((stat: any) => {
      doc
        .fontSize(12)
        .text(
          `${stat.status}: ${stat.percentage}% (${stat.count} orders)`,
          50,
          yPos
        );
      yPos += 20;
    });

    yPos += 20;
    doc.fontSize(16).text("Shipping Type Breakdown", 50, yPos);
    yPos += 30;
    reportData.shippingTypeBreakdown.forEach((stat: any) => {
      doc
        .fontSize(12)
        .text(
          `${stat.type}: ${stat.percentage}% (${stat.count} orders)`,
          50,
          yPos
        );
      yPos += 20;
    });

    doc.end();

    return new Promise((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
    });
  }

  // Vendor Verification Controllers
  static async getVendorVerificationDocuments(req: Request, res: Response) {
    try {
      const { vendorId } = req.params;

      const vendor = await Vendor.findById(vendorId)
        .populate("userId", "email profile.firstName profile.lastName")
        .select("verificationDocuments kycStatus businessInfo accountType");

      if (!vendor) {
        return res.status(404).json({
          success: false,
          message: "Vendor not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Vendor verification documents retrieved successfully",
        data: {
          vendorId: vendor._id,
          user: vendor.userId,
          kycStatus: vendor.kycStatus,
          accountType: vendor.accountType,
          businessInfo: vendor.businessInfo,
          documents: vendor.verificationDocuments,
        },
      });
    } catch (error: any) {
      console.error("GetVendorVerificationDocuments Error:", error.message);
      res.status(500).json({
        success: false,
        message: "Server error while fetching vendor documents",
      });
    }
  }

  static async acceptVendorApplication(req: Request, res: Response) {
    try {
      const { vendorId } = req.params;
      const adminId = req.userId;

      const vendor = await Vendor.findById(vendorId);
      if (!vendor) {
        return res.status(404).json({
          success: false,
          message: "Vendor not found",
        });
      }

      // Update vendor status and KYC
      vendor.kycStatus = "verified";
      vendor.status = "active";

      // Mark all documents as verified
      vendor.verificationDocuments.forEach((doc) => {
        doc.status = "verified";
        doc.verifiedAt = new Date();
        doc.verifiedBy = adminId;
      });

      await vendor.save();

      // Get vendor user details for notifications
      const vendorUser = await User.findById(vendor.userId);
      if (vendorUser) {
        const businessName =
          vendorUser.businessName ||
          vendor.businessInfo?.name ||
          vendorUser.profile?.firstName ||
          "Vendor";

        // Send email notification
        await sendVendorVerificationAcceptedEmail(
          vendorUser.email,
          businessName
        );

        // Send in-app notification
        await Notification.create({
          userId: vendor.userId,
          type: "verification",
          case: "approved",
          title: "Verification Approved!",
          message:
            "Congratulations! Your vendor verification has been approved. You can now start selling on our platform.",
          data: {
            redirectUrl: "/vendor/dashboard",
            entityId: vendorId,
            entityType: "vendor",
          },
          isRead: false,
        });
      }

      // Log the action
      await AuditLogService.log(
        "VENDOR_APPLICATION_ACCEPTED",
        "vendor",
        "info",
        {
          vendorId,
          acceptedBy: adminId,
          previousKycStatus: "pending",
          newKycStatus: "verified",
        },
        req,
        vendorId
      );

      res.status(200).json({
        success: true,
        message: "Vendor application accepted successfully",
        data: {
          vendorId: vendor._id,
          kycStatus: vendor.kycStatus,
          status: vendor.status,
        },
      });
    } catch (error: any) {
      console.error("AcceptVendorApplication Error:", error.message);
      res.status(500).json({
        success: false,
        message: "Server error while accepting vendor application",
      });
    }
  }

  static async rejectVendorApplication(req: Request, res: Response) {
    try {
      const { vendorId } = req.params;
      const { reason, documentRemarks } = req.body;
      const adminId = req.userId;

      if (!reason) {
        return res.status(400).json({
          success: false,
          message: "Rejection reason is required",
        });
      }

      const vendor = await Vendor.findById(vendorId);
      if (!vendor) {
        return res.status(404).json({
          success: false,
          message: "Vendor not found",
        });
      }

      // Update vendor KYC status
      vendor.kycStatus = "rejected";

      // Mark documents as rejected with remarks
      vendor.verificationDocuments.forEach((doc, index) => {
        doc.status = "rejected";
        doc.verifiedAt = new Date();
        doc.verifiedBy = adminId;
        doc.remarks = documentRemarks?.[index] || reason;
      });

      await vendor.save();

      // Get vendor user details for notifications
      const vendorUser = await User.findById(vendor.userId);
      if (vendorUser) {
        const businessName =
          vendorUser.businessName ||
          vendor.businessInfo?.name ||
          vendorUser.profile?.firstName ||
          "Vendor";

        // Send email notification
        await sendVendorVerificationRejectedEmail(
          vendorUser.email,
          businessName,
          reason
        );

        // Send in-app notification
        await Notification.create({
          userId: vendor.userId,
          type: "verification",
          case: "rejected",
          title: "Verification Update Required",
          message: `Your vendor verification has been rejected. Reason: ${reason}. Please resubmit your documents after addressing the issues.`,
          data: {
            redirectUrl: "/vendor/verification",
            entityId: vendorId,
            entityType: "vendor",
          },
          isRead: false,
        });
      }

      // Log the action
      await AuditLogService.log(
        "VENDOR_APPLICATION_REJECTED",
        "vendor",
        "warning",
        {
          vendorId,
          rejectedBy: adminId,
          reason,
          documentRemarks,
          previousKycStatus: "pending",
          newKycStatus: "rejected",
        },
        req,
        vendorId
      );

      res.status(200).json({
        success: true,
        message: "Vendor application rejected successfully",
        data: {
          vendorId: vendor._id,
          kycStatus: vendor.kycStatus,
          reason,
        },
      });
    } catch (error: any) {
      console.error("RejectVendorApplication Error:", error.message);
      res.status(500).json({
        success: false,
        message: "Server error while rejecting vendor application",
      });
    }
  }

  // Finance Management Controllers
  static async getFinanceStats(req: Request, res: Response) {
    try {
      const [orders, wallets, payouts] = await Promise.all([
        Order.aggregate([
          { $unwind: "$items" },
          {
            $lookup: {
              from: "products",
              localField: "items.productId",
              foreignField: "_id",
              as: "product",
            },
          },
          { $unwind: "$product" },
          {
            $lookup: {
              from: "countries",
              localField: "product.currency",
              foreignField: "currency",
              as: "country",
            },
          },
          { $unwind: "$country" },
          {
            $group: {
              _id: null,
              totalRevenue: {
                $sum: {
                  $divide: [
                    { $multiply: ["$items.price", "$items.quantity"] },
                    "$country.exchangeRate",
                  ],
                },
              },
              platformFees: {
                $sum: {
                  $divide: [
                    { $multiply: ["$items.price", "$items.quantity", 0.05] },
                    "$country.exchangeRate",
                  ],
                },
              },
            },
          },
        ]),
        Wallet.aggregate([
          {
            $lookup: {
              from: "countries",
              localField: "currency",
              foreignField: "currency",
              as: "country",
            },
          },
          { $unwind: "$country" },
          {
            $group: {
              _id: null,
              escrowBalance: {
                $sum: {
                  $divide: ["$balance", "$country.exchangeRate"],
                },
              },
            },
          },
        ]),
        VendorPayment.aggregate([
          { $match: { status: "pending" } },
          {
            $group: {
              _id: null,
              pendingPayouts: { $sum: "$amount" },
            },
          },
        ]),
      ]);

      const stats = {
        totalRevenue: Math.round((orders[0]?.totalRevenue || 0) * 100) / 100,
        escrowBalance: Math.round((wallets[0]?.escrowBalance || 0) * 100) / 100,
        pendingPayouts:
          Math.round((payouts[0]?.pendingPayouts || 0) * 100) / 100,
        platformFees: Math.round((orders[0]?.platformFees || 0) * 100) / 100,
        baseCurrency: "USD",
      };

      res.json({
        success: true,
        message: "Finance statistics retrieved successfully",
        data: stats,
      });
    } catch (error: any) {
      console.error("Get Finance Stats Error:", error.message);
      res.status(500).json({
        success: false,
        message: "Server error while fetching finance statistics",
      });
    }
  }

  static async getAllTransactions(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10, status } = req.query;

      const query: any = {};
      if (status) query.status = status;

      const transactions = await Payment.find(query)
        .populate("userId", "email profile.firstName profile.lastName")
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit));

      const total = await Payment.countDocuments(query);

      res.json({
        success: true,
        data: {
          transactions,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error: any) {
      console.error("Get All Transactions Error:", error.message);
      res.status(500).json({
        success: false,
        message: "Server error while fetching transactions",
      });
    }
  }

  static async getRevenueAnalytics(req: Request, res: Response) {
    try {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
      const twelveMonthsAgo = new Date(
        now.getFullYear() - 1,
        now.getMonth(),
        now.getDate()
      );

      const [dailyRevenue, weeklyRevenue, monthlyRevenue] = await Promise.all([
        // Last 7 days
        Order.aggregate([
          { $match: { createdAt: { $gte: sevenDaysAgo } } },
          { $unwind: "$items" },
          {
            $lookup: {
              from: "products",
              localField: "items.productId",
              foreignField: "_id",
              as: "product",
            },
          },
          { $unwind: "$product" },
          {
            $lookup: {
              from: "countries",
              localField: "product.currency",
              foreignField: "currency",
              as: "country",
            },
          },
          { $unwind: "$country" },
          {
            $group: {
              _id: { $dayOfWeek: "$createdAt" },
              revenue: {
                $sum: {
                  $divide: [
                    { $multiply: ["$items.price", "$items.quantity"] },
                    "$country.exchangeRate",
                  ],
                },
              },
            },
          },
          { $sort: { _id: 1 } },
        ]),
        // Last 4 weeks
        Order.aggregate([
          { $match: { createdAt: { $gte: fourWeeksAgo } } },
          { $unwind: "$items" },
          {
            $lookup: {
              from: "products",
              localField: "items.productId",
              foreignField: "_id",
              as: "product",
            },
          },
          { $unwind: "$product" },
          {
            $lookup: {
              from: "countries",
              localField: "product.currency",
              foreignField: "currency",
              as: "country",
            },
          },
          { $unwind: "$country" },
          {
            $group: {
              _id: { $week: "$createdAt" },
              revenue: {
                $sum: {
                  $divide: [
                    { $multiply: ["$items.price", "$items.quantity"] },
                    "$country.exchangeRate",
                  ],
                },
              },
            },
          },
          { $sort: { _id: 1 } },
        ]),
        // Last 12 months
        Order.aggregate([
          { $match: { createdAt: { $gte: twelveMonthsAgo } } },
          { $unwind: "$items" },
          {
            $lookup: {
              from: "products",
              localField: "items.productId",
              foreignField: "_id",
              as: "product",
            },
          },
          { $unwind: "$product" },
          {
            $lookup: {
              from: "countries",
              localField: "product.currency",
              foreignField: "currency",
              as: "country",
            },
          },
          { $unwind: "$country" },
          {
            $group: {
              _id: { $month: "$createdAt" },
              revenue: {
                $sum: {
                  $divide: [
                    { $multiply: ["$items.price", "$items.quantity"] },
                    "$country.exchangeRate",
                  ],
                },
              },
            },
          },
          { $sort: { _id: 1 } },
        ]),
      ]);

      // Format daily data
      const dayNames = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      const last7Days = dayNames.map((day, index) => {
        const dayData = dailyRevenue.find((d) => d._id === index + 1);
        return {
          day,
          revenue: Math.round((dayData?.revenue || 0) * 100) / 100,
        };
      });

      // Format weekly data
      const currentWeek = Math.ceil((now.getDate() - now.getDay()) / 7);
      const last4Weeks = Array.from({ length: 4 }, (_, i) => {
        const weekNumber = currentWeek - (3 - i);
        const weekData = weeklyRevenue.find((w) => w._id === weekNumber);
        return {
          week: `Week ${i + 1}`,
          revenue: Math.round((weekData?.revenue || 0) * 100) / 100,
        };
      });

      // Format monthly data
      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      const last12Months = monthNames.map((month, index) => {
        const monthData = monthlyRevenue.find((m) => m._id === index + 1);
        return {
          month,
          revenue: Math.round((monthData?.revenue || 0) * 100) / 100,
        };
      });

      res.json({
        success: true,
        message: "Revenue analytics retrieved successfully",
        data: {
          last7Days,
          last4Weeks,
          last12Months,
          baseCurrency: "USD",
        },
      });
    } catch (error: any) {
      console.error("Get Revenue Analytics Error:", error.message);
      res.status(500).json({
        success: false,
        message: "Server error while fetching revenue analytics",
      });
    }
  }

  static async getWithdrawals(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10, status } = req.query;

      const query: any = {};
      if (status) query.status = status;

      const withdrawals = await Withdrawal.find(query)
        .populate("userId", "email profile.firstName profile.lastName")
        .populate("processedBy", "email profile.firstName profile.lastName")
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit));

      const total = await Withdrawal.countDocuments(query);

      res.json({
        success: true,
        data: {
          withdrawals,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error: any) {
      console.error("Get Withdrawals Error:", error.message);
      res.status(500).json({
        success: false,
        message: "Server error while fetching withdrawals",
      });
    }
  }

  static async approveWithdrawal(req: Request, res: Response) {
    try {
      const { withdrawalId } = req.params;
      const adminId = req.userId;

      const withdrawal = await Withdrawal.findById(withdrawalId).populate(
        "userId",
        "email profile.firstName profile.lastName"
      );

      if (!withdrawal) {
        return res
          .status(404)
          .json({ success: false, message: "Withdrawal not found" });
      }

      if (withdrawal.status !== "pending") {
        return res
          .status(400)
          .json({ success: false, message: "Withdrawal already processed" });
      }

      // Check user wallet balance
      const wallet = await Wallet.findOne({ userId: withdrawal.userId });
      if (!wallet || wallet.balance < withdrawal.amount) {
        return res
          .status(400)
          .json({ success: false, message: "Insufficient wallet balance" });
      }

      // Deduct from wallet
      wallet.balance -= withdrawal.amount;
      wallet.transactions.push({
        type: "debit",
        amount: withdrawal.amount,
        description: `Withdrawal approved - ${withdrawal.method}`,
        date: new Date(),
      });
      await wallet.save();

      // Update withdrawal status
      withdrawal.status = "approved";
      withdrawal.processedBy = adminId;
      withdrawal.processedAt = new Date();
      await withdrawal.save();

      // Send notification
      await Notification.create({
        userId: withdrawal.userId,
        type: "withdrawal",
        case: "approved",
        title: "Withdrawal Approved",
        message: `Your withdrawal request of ${withdrawal.amount} ${withdrawal.currency} has been approved.`,
        data: {
          redirectUrl: `/wallet/withdrawals`,
          entityId: withdrawalId,
          entityType: "withdrawal",
        },
      });

      // Log action
      await AuditLogService.log(
        "WITHDRAWAL_APPROVED",
        "withdrawal",
        "info",
        {
          withdrawalId,
          userId: withdrawal.userId,
          amount: withdrawal.amount,
          approvedBy: adminId,
        },
        req,
        withdrawalId
      );

      res.json({
        success: true,
        message: "Withdrawal approved successfully",
        data: withdrawal,
      });
    } catch (error: any) {
      console.error("Approve Withdrawal Error:", error.message);
      res.status(500).json({
        success: false,
        message: "Server error while approving withdrawal",
      });
    }
  }

  static async rejectWithdrawal(req: Request, res: Response) {
    try {
      const { withdrawalId } = req.params;
      const { reason } = req.body;
      const adminId = req.userId;

      const withdrawal = await Withdrawal.findById(withdrawalId).populate(
        "userId",
        "email profile.firstName profile.lastName"
      );

      if (!withdrawal) {
        return res
          .status(404)
          .json({ success: false, message: "Withdrawal not found" });
      }

      if (withdrawal.status !== "pending") {
        return res
          .status(400)
          .json({ success: false, message: "Withdrawal already processed" });
      }

      withdrawal.status = "rejected";
      withdrawal.processedBy = adminId;
      withdrawal.processedAt = new Date();
      withdrawal.rejectionReason = reason;
      await withdrawal.save();

      // Send notification
      await Notification.create({
        userId: withdrawal.userId,
        type: "withdrawal",
        case: "rejected",
        title: "Withdrawal Rejected",
        message: `Your withdrawal request has been rejected. Reason: ${reason}`,
        data: {
          redirectUrl: `/wallet/withdrawals`,
          entityId: withdrawalId,
          entityType: "withdrawal",
        },
      });

      // Log action
      await AuditLogService.log(
        "WITHDRAWAL_REJECTED",
        "withdrawal",
        "warning",
        {
          withdrawalId,
          userId: withdrawal.userId,
          amount: withdrawal.amount,
          rejectedBy: adminId,
          reason,
        },
        req,
        withdrawalId
      );

      res.json({
        success: true,
        message: "Withdrawal rejected successfully",
        data: withdrawal,
      });
    } catch (error: any) {
      console.error("Reject Withdrawal Error:", error.message);
      res.status(500).json({
        success: false,
        message: "Server error while rejecting withdrawal",
      });
    }
  }

  // Content Management Controllers
  // Banner Management
  static async createBanner(req: Request, res: Response) {
    try {
      const {
        title,
        imageUrl,
        targetUrl,
        altText,
        position,
        activeImmediately,
        startDate,
        endDate,
      } = req.body;
      const adminId = req.userId;

      const banner = await Banner.create({
        title,
        imageUrl,
        targetUrl,
        altText,
        position,
        createdBy: adminId,
      });

      if (activeImmediately) {
        banner.status = "active";
        banner.activeImmediately = true;
        banner.startDate = new Date();
        if (endDate) banner.endDate = new Date(endDate);
        await banner.save();
      }

      if (!activeImmediately) {
        banner.status = "scheduled";
        banner.startDate = new Date(startDate);
        banner.endDate = endDate ? new Date(endDate) : undefined;
        await banner.save();
      }

      res.json({
        success: true,
        message: "Banner created successfully",
        data: banner,
      });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, message: "Error creating banner" });
    }
  }

  static async getBanners(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10, status, position } = req.query;
      const query: any = {};
      if (status) query.status = status;
      if (position) query.position = position;

      const banners = await Banner.find(query)
        .populate("createdBy", "email profile.firstName profile.lastName")
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit));

      const total = await Banner.countDocuments(query);

      res.json({
        success: true,
        data: {
          banners,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, message: "Error fetching banners" });
    }
  }

  static async updateBanner(req: Request, res: Response) {
    try {
      const { bannerId } = req.params;
      const updates = req.body;

      const banner = await Banner.findByIdAndUpdate(bannerId, updates, {
        new: true,
      });
      if (!banner) {
        return res
          .status(404)
          .json({ success: false, message: "Banner not found" });
      }

      res.json({
        success: true,
        message: "Banner updated successfully",
        data: banner,
      });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, message: "Error updating banner" });
    }
  }

  static async deleteBanner(req: Request, res: Response) {
    try {
      const { bannerId } = req.params;
      await Banner.findByIdAndDelete(bannerId);
      res.json({ success: true, message: "Banner deleted successfully" });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, message: "Error deleting banner" });
    }
  }

  static async getBannerAnalytics(req: Request, res: Response) {
    try {
      const banners = await Banner.find({ status: "active" })
        .select("title position clickCount impressions createdAt")
        .sort({ clickCount: -1 });

      const analytics = banners.map((banner) => ({
        id: banner._id,
        title: banner.title,
        position: banner.position,
        clicks: banner.clickCount,
        impressions: banner.impressions,
        clickThroughRate:
          banner.impressions > 0
            ? `${((banner.clickCount / banner.impressions) * 100).toFixed(2)}%`
            : "0.00%",
        createdAt: banner.createdAt,
      }));

      const totalClicks = banners.reduce((sum, b) => sum + b.clickCount, 0);
      const totalImpressions = banners.reduce(
        (sum, b) => sum + b.impressions,
        0
      );
      const overallCTR =
        totalImpressions > 0
          ? `${((totalClicks / totalImpressions) * 100).toFixed(2)}%`
          : "0.00%";

      res.json({
        success: true,
        data: {
          banners: analytics,
          summary: {
            totalBanners: banners.length,
            totalClicks,
            totalImpressions,
            overallClickThroughRate: overallCTR,
          },
        },
      });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, message: "Error fetching banner analytics" });
    }
  }

  // Policy Management
  static async createPolicy(req: Request, res: Response) {
    try {
      const { title, category, content, status } = req.body;
      const adminId = req.userId;

      const policy = await Policy.create({
        title,
        category,
        content,
        createdBy: adminId,
        status,
      });
      res.json({
        success: true,
        message: "Policy created successfully",
        data: policy,
      });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, message: "Error creating policy" });
    }
  }

  static async getPolicies(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10, status, category } = req.query;
      const query: any = {};
      if (status) query.status = status;
      if (category) query.category = category;

      const policies = await Policy.find(query)
        .populate("createdBy", "email profile.firstName profile.lastName")
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit));

      const total = await Policy.countDocuments(query);

      res.json({
        success: true,
        data: {
          policies,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, message: "Error fetching policies" });
    }
  }

  static async updatePolicy(req: Request, res: Response) {
    try {
      const { policyId } = req.params;
      const updates = req.body;

      const policy = await Policy.findByIdAndUpdate(policyId, updates, { new: true });
      if (!policy) {
        return res.status(404).json({ success: false, message: "Policy not found" });
      }

      res.json({ success: true, message: "Policy updated successfully", data: policy });
    } catch (error: any) {
      res.status(500).json({ success: false, message: "Error updating policy" });
    }
  }

  static async deletePolicy(req: Request, res: Response) {
    try {
      const { policyId } = req.params;
      await Policy.findByIdAndDelete(policyId);
      res.json({ success: true, message: "Policy deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: "Error deleting policy" });
    }
  }

  static async publishPolicy(req: Request, res: Response) {
    try {
      const { policyId } = req.params;
      const policy = await Policy.findByIdAndUpdate(
        policyId,
        { status: "published", publishedAt: new Date() },
        { new: true }
      );

      if (!policy) {
        return res
          .status(404)
          .json({ success: false, message: "Policy not found" });
      }

      res.json({
        success: true,
        message: "Policy published successfully",
        data: policy,
      });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, message: "Error publishing policy" });
    }
  }

  // FAQ Management
  static async createFAQ(req: Request, res: Response) {
    try {
      const { question, answer, category, tags } = req.body;
      const adminId = req.userId;

      if (!question || !answer || !category) {
        return res.status(400).json({
          success: false,
          message: "Question, answer, and category are required",
        });
      }

      const faq = await FAQ.create({
        question,
        answer,
        category,
        tags,
        createdBy: adminId,
      });
      res.json({
        success: true,
        message: "FAQ created successfully",
        data: faq,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: "Error creating FAQ" });
    }
  }

  static async editFAQ(req: Request, res: Response) {
    try {
      const { faqId } = req.params;
      const updates = req.body;

      const faq = await FAQ.findById(faqId);
      if (!faq) {
        res.status(404).json({
          success: false,
          message: "FAQ not found"
        });
        return;
      }

      Object.assign(faq, updates);
      await faq.save();

      res.status(200).json({
        success: true,
        message: "FAQ updated successfully",
        data: faq
      });

    } catch (error) {
      console.error("Error updating FAQ:", error);
      res.status(500).json({
        success: false,
        message: "An error occurred while updating the FAQ"
      });
    }
  }

  static async deleteFAQ(req: Request, res: Response) {
    try {
      const { faqId } = req.params;
      await FAQ.findByIdAndDelete(faqId);
      res.json({ success: true, message: "FAQ deleted successfully" });
    } catch (error: any) {
      console.error("An error occured while trying to delete FAQ:", error);
      res.status(500).json({ success: false, message: "Error deleting FAQ" });
    }
  }

  static async getFAQs(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10, status, category, search } = req.query;
      const query: any = {};
      if (status) query.status = status;
      if (category) query.category = category;
      if (search) {
        query.$or = [
          { question: { $regex: search, $options: "i" } },
          { answer: { $regex: search, $options: "i" } },
          { tags: { $regex: search, $options: "i" } },
        ];
      }

      const faqs = await FAQ.find(query)
        .populate("createdBy", "email profile.firstName profile.lastName")
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit));
      const total = await FAQ.countDocuments(query);
      res.json({
        success: true,
        data: {
          faqs,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: "Error fetching FAQs" });
    }
  }


  static async getFAQStats(req: Request, res: Response) {
    try {
      const [totalFAQs, publishedFAQs, mostViewed, totalViews] =
        await Promise.all([
          FAQ.countDocuments(),
          FAQ.countDocuments({ status: "published" }),
          FAQ.find({ status: "published" })
            .sort({ viewCount: -1 })
            .limit(10)
            .select("question viewCount"),
          FAQ.aggregate([
            { $group: { _id: null, totalViews: { $sum: "$viewCount" } } },
          ]),
        ]);

      res.json({
        success: true,
        data: {
          totalFAQs,
          publishedFAQs,
          mostViewed,
          totalViews: totalViews[0]?.totalViews || 0,
        },
      });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, message: "Error fetching FAQ stats" });
    }
  }

  // Notification Management
  static async createNotification(req: Request, res: Response) {
    try {
      const { title, content, audience, targetUsers, scheduledFor } = req.body;
      const adminId = req.userId;

      const notification = await AdminNotification.create({
        title,
        content,
        audience,
        targetUsers,
        scheduledFor,
        createdBy: adminId,
      });

      res.json({
        success: true,
        message: "Notification created successfully",
        data: notification,
      });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, message: "Error creating notification" });
    }
  }

  static async sendNotification(req: Request, res: Response) {
    try {
      const { notificationId } = req.params;
      const notification = await AdminNotification.findById(notificationId);

      if (!notification) {
        return res
          .status(404)
          .json({ success: false, message: "Notification not found" });
      }

      let targetUserIds: any[] = [];
      if (notification.audience === "all") {
        const users = await User.find({}).select("_id");
        targetUserIds = users.map((u) => u._id);
      } else if (notification.audience === "vendors") {
        const users = await User.find({ role: "business" }).select("_id");
        targetUserIds = users.map((u) => u._id);
      } else if (notification.audience === "buyers") {
        const users = await User.find({ role: "personal" }).select("_id");
        targetUserIds = users.map((u) => u._id);
      } else {
        targetUserIds = notification.targetUsers || [];
      }

      // Send notifications to all target users
      const notifications = targetUserIds.map((userId) => ({
        userId,
        type: "system",
        case: "announcement",
        title: notification.title,
        message: notification.content,
        data: {},
        isRead: false,
      }));

      await Notification.insertMany(notifications);

      notification.status = "sent";
      notification.sentAt = new Date();
      await notification.save();

      res.json({
        success: true,
        message: "Notification sent successfully",
        sentTo: targetUserIds.length,
      });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, message: "Error sending notification" });
    }
  }

  // Advertisement Management
  static async getAdvertisements(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10, status } = req.query;
      const query: any = {};
      if (status) query.status = status;

      const ads = await Advertisement.find(query)
        .populate("vendorId", "businessInfo.name userId")
        .populate("reviewedBy", "email profile.firstName profile.lastName")
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit));

      const total = await Advertisement.countDocuments(query);

      res.json({
        success: true,
        data: {
          advertisements: ads,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, message: "Error fetching advertisements" });
    }
  }

  static async approveAdvertisement(req: Request, res: Response) {
    try {
      const { adId } = req.params;
      const adminId = req.userId;

      const existingAdvert = await Advertisement.findById(adId);
      if (!existingAdvert) {
        throw new Error("Advertisement not found");
      }

      const endDate = new Date(
        Date.now() + existingAdvert.duration * 24 * 60 * 60 * 1000
      );

      const updatedAdvert = await Advertisement.findByIdAndUpdate(
        adId,
        {
          status: "approved",
          reviewedBy: adminId,
          reviewedAt: new Date(),
          startDate: new Date(),
          endDate: endDate,
        },
        { new: true }
      ).populate("vendorId", "userId businessInfo.name");

      if (!updatedAdvert) {
        return res
          .status(404)
          .json({ success: false, message: "Advertisement not found" });
      }

      // Notify vendor
      await Notification.create({
        userId: (updatedAdvert.vendorId as any).userId,
        type: "advertisement",
        case: "approved",
        title: "Advertisement Approved",
        message: `Your advertisement "${updatedAdvert.title}" has been approved and is now live.`,
        data: {
          redirectUrl: `/vendor/advertisements`,
          entityId: adId,
          entityType: "advertisement",
        },
      });

      res.json({
        success: true,
        message: "Advertisement approved successfully",
        data: updatedAdvert,
      });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, message: "Error approving advertisement" });
    }
  }

  static async rejectAdvertisement(req: Request, res: Response) {
    try {
      const { adId } = req.params;
      const { reason } = req.body;
      const adminId = req.userId;

      const ad = await Advertisement.findByIdAndUpdate(
        adId,
        {
          status: "rejected",
          reviewedBy: adminId,
          reviewedAt: new Date(),
          rejectionReason: reason,
        },
        { new: true }
      ).populate("vendorId", "userId businessInfo.name");

      if (!ad) {
        return res
          .status(404)
          .json({ success: false, message: "Advertisement not found" });
      }

      // Notify vendor
      await Notification.create({
        userId: (ad.vendorId as any).userId,
        type: "advertisement",
        case: "rejected",
        title: "Advertisement Rejected",
        message: `Your advertisement "${ad.title}" has been rejected. Reason: ${reason}`,
        data: {
          redirectUrl: `/vendor/advertisements`,
          entityId: adId,
          entityType: "advertisement",
        },
      });

      res.json({
        success: true,
        message: "Advertisement rejected successfully",
        data: ad,
      });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, message: "Error rejecting advertisement" });
    }
  }

  // Issue Management Controllers
  static async getAllIssues(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10, status, priority, assignedTo } = req.query;

      const query: any = {};
      if (status) query.status = status;
      if (priority) query.priority = priority;
      if (assignedTo) query.assignedTo = assignedTo;

      const issues = await Issue.find(query)
        .populate("userId", "email profile.firstName profile.lastName")
        .populate("orderId", "_id items createdAt")
        .populate("assignedTo", "email profile.firstName profile.lastName")
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
      console.error("Get All Issues Error:", error.message);
      res.status(500).json({
        success: false,
        message: "Server error while fetching issues",
      });
    }
  }

  static async getIssueStats(req: Request, res: Response) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [openDisputes, inProgress, resolvedToday, avgResolutionData] =
        await Promise.all([
          Issue.countDocuments({ status: "open" }),
          Issue.countDocuments({ status: "in-progress" }),
          Issue.countDocuments({
            status: "resolved",
            resolvedAt: { $gte: today, $lt: tomorrow },
          }),
          Issue.aggregate([
            { $match: { status: "resolved", resolvedAt: { $exists: true } } },
            {
              $project: {
                resolutionTime: {
                  $divide: [
                    { $subtract: ["$resolvedAt", "$createdAt"] },
                    1000 * 60 * 60 * 24,
                  ],
                },
              },
            },
            {
              $group: {
                _id: null,
                avgResolutionTime: { $avg: "$resolutionTime" },
              },
            },
          ]),
        ]);

      const averageResolutionTime =
        avgResolutionData[0]?.avgResolutionTime || 0;

      res.status(200).json({
        success: true,
        message: "Issue statistics retrieved successfully",
        data: {
          openDisputes,
          inProgress,
          resolvedToday,
          averageResolutionTime: Math.round(averageResolutionTime * 10) / 10,
        },
      });
    } catch (error: any) {
      console.error("Get Issue Stats Error:", error.message);
      res.status(500).json({
        success: false,
        message: "Server error while fetching issue statistics",
      });
    }
  }

  static async updateIssueStatus(req: Request, res: Response) {
    try {
      const { issueId } = req.params;
      const { status, priority, assignedTo, resolution } = req.body;
      const adminId = req.userId;

      const issue = await Issue.findById(issueId);
      if (!issue) {
        return res.status(404).json({
          success: false,
          message: "Issue not found",
        });
      }

      const oldStatus = issue.status;

      // Update fields if provided
      if (status) issue.status = status;
      if (priority) issue.priority = priority;
      if (assignedTo) issue.assignedTo = assignedTo;
      if (resolution) {
        issue.resolution = resolution;
        if (status === "resolved") {
          issue.resolvedAt = new Date();
        }
      }

      await issue.save();

      // Notify user if status changed
      if (status && status !== oldStatus) {
        await Notification.create({
          userId: issue.userId,
          type: "issue",
          case: "status-update",
          title: "Issue Status Updated",
          message: `Your issue ${
            issue.caseId
          } status has been updated to ${status}.${
            resolution ? ` Resolution: ${resolution}` : ""
          }`,
          data: {
            redirectUrl: `/issues/${issue._id}`,
            entityId: issue._id,
            entityType: "issue",
          },
          isRead: false,
        });
      }

      // Log the action
      await AuditLogService.log(
        "ISSUE_UPDATED",
        "issue",
        "info",
        {
          issueId,
          caseId: issue.caseId,
          updatedBy: adminId,
          changes: { status, priority, assignedTo, resolution },
        },
        req,
        issueId
      );

      res.status(200).json({
        success: true,
        message: "Issue updated successfully",
        data: issue,
      });
    } catch (error: any) {
      console.error("Update Issue Status Error:", error.message);
      res.status(500).json({
        success: false,
        message: "Server error while updating issue",
      });
    }
  }

  // Promotion Management
  /**
   * #swagger.tags = ['Admin - Promotions']
   * #swagger.summary = 'Create Promotion'
   * #swagger.description = 'Create a new promotion'
   * #swagger.security = [{ "Bearer": [] }]
   * #swagger.parameters['body'] = {
   *   in: 'body',
   *   required: true,
   *   schema: { $ref: '#/definitions/Promotion' }
   * }
   */
  static async createPromotion(req: Request, res: Response) {
    try {
      const { title, description, status, startDate, endDate } = req.body;
      const adminId = req.userId;

      const promotion = await Promotion.create({
        title,
        description,
        status,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        createdBy: adminId
      });

      res.status(201).json({
        success: true,
        message: "Promotion created successfully",
        data: promotion
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: "Error creating promotion" });
    }
  }

  /**
   * #swagger.tags = ['Admin - Promotions']
   * #swagger.summary = 'Get Promotions'
   * #swagger.description = 'Retrieve all promotions with pagination'
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
   *   enum: ['active', 'inactive', 'expired'],
   *   description: 'Filter by promotion status'
   * }
   */
  static async getPromotions(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10, status } = req.query;
      const query: any = {};
      if (status) query.status = status;

      const promotions = await Promotion.find(query)
        .populate("createdBy", "email profile.firstName profile.lastName")
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit));

      const total = await Promotion.countDocuments(query);

      res.json({
        success: true,
        data: {
          promotions,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit))
          }
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: "Error fetching promotions" });
    }
  }

  /**
   * #swagger.tags = ['Admin - Promotions']
   * #swagger.summary = 'Update Promotion'
   * #swagger.description = 'Update an existing promotion'
   * #swagger.security = [{ "Bearer": [] }]
   * #swagger.parameters['promotionId'] = {
   *   in: 'path',
   *   required: true,
   *   type: 'string',
   *   description: 'Promotion ID'
   * }
   * #swagger.parameters['body'] = {
   *   in: 'body',
   *   schema: { $ref: '#/definitions/Promotion' }
   * }
   */
  static async updatePromotion(req: Request, res: Response) {
    try {
      const { promotionId } = req.params;
      const updates = req.body;

      const promotion = await Promotion.findByIdAndUpdate(
        promotionId,
        updates,
        { new: true }
      );

      if (!promotion) {
        return res.status(404).json({
          success: false,
          message: "Promotion not found"
        });
      }

      res.json({
        success: true,
        message: "Promotion updated successfully",
        data: promotion
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: "Error updating promotion" });
    }
  }

  /**
   * #swagger.tags = ['Admin - Promotions']
   * #swagger.summary = 'Delete Promotion'
   * #swagger.description = 'Delete a promotion'
   * #swagger.security = [{ "Bearer": [] }]
   * #swagger.parameters['promotionId'] = {
   *   in: 'path',
   *   required: true,
   *   type: 'string',
   *   description: 'Promotion ID'
   * }
   */
  static async deletePromotion(req: Request, res: Response) {
    try {
      const { promotionId } = req.params;
      await Promotion.findByIdAndDelete(promotionId);
      res.json({ success: true, message: "Promotion deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: "Error deleting promotion" });
    }
  }
}
