import { NextFunction, Request, Response } from "express";
import User from "../models/user.model";
import Notification from "../models/notification.model";
import redisService from "../services/redis.service";
import Wallet from "../models/wallet.model";
import mongoose from "mongoose";
import Product from "../models/product.model";
import Order from "../models/order.model";
import { OrderService } from "../services/order.service";
import FAQ from "../models/faq.model";

export const addAddress = async (req: Request, res: Response) => {
  try {
    const { address } = req.body;

    const { type, street, city, state, country, postalCode } = address;

    if (!type || !street || !city || !state || !country || !postalCode) {
      return res.status(400).json({
        success: false,
        message: "All address fields are required",
      });
    }

    if (!address) {
      return res.status(400).json({
        success: false,
        message: "Address is required",
      });
    }
    const { userId } = req;
    const user = await User.findOne({ _id: userId });

    if (user && user.addresses) {
      const hasDefaultAddress = user.addresses.find(
        (address: any) => address.default === true
      );

      const modifiedAddress = {
        type,
        street,
        city,
        state,
        country,
        postalCode,
        isDefault: hasDefaultAddress ? false : true,
      };
      user.addresses.push(modifiedAddress);
      await user.save();
    } else {
      throw new Error("An error occured while trying to add address");
    }

    return res.status(200).json({
      success: true,
      message: "Address added successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "An error occured while trying to add address",
    });
  }
};

export const modifyAddress = async (req: Request, res: Response) => {
  try {
    const { address } = req.body;
    const { userId } = req;

    const user = await User.findById(userId);
    if (!user || !user.addresses) {
      throw new Error("User or address list not found");
    }

    const addressIndex = user.addresses.findIndex(
      (addr: any) => addr._id.toString() === address._id.toString()
    );

    if (addressIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    //If this address is being set as default...
    if (address.isDefault === true) {
      const targetType = address.type;

      // Clear default flag from other addresses of same type
      user.addresses = user.addresses.map((addr: any, idx: number) => {
        if (addr.type === targetType && idx !== addressIndex) {
          return { ...addr.toObject(), isDefault: false };
        }
        return idx === addressIndex ? address : addr;
      });
    } else {
      // Just replace address as it is
      user.addresses[addressIndex] = address;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Address modified successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "An error occurred while trying to modify address",
    });
  }
};

export const deleteAddress = async (req: Request, res: Response) => {
  try {
    const { userId } = req;
    const addressIdToRemove = req.params.id;

    const user = await User.findById(userId);
    if (!user || !user.addresses) {
      return res.status(404).json({
        success: false,
        message: "User or address list not found",
      });
    }

    const targetIndex = user.addresses.findIndex(
      (addr: any) => addr._id.toString() === addressIdToRemove
    );

    if (targetIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    const targetAddress = user.addresses[targetIndex];

    // 🚫 If trying to delete default shipping address, ensure there's another one marked default
    if (targetAddress.type === "shipping" && targetAddress.isDefault === true) {
      const hasOtherShippingDefault = user.addresses.some(
        (addr: any, i: number) =>
          i !== targetIndex &&
          addr.type === "shipping" &&
          addr.isDefault === true
      );

      if (!hasOtherShippingDefault) {
        return res.status(400).json({
          success: false,
          message:
            "Cannot delete default shipping address unless another shipping address is set as default.",
        });
      }
    }

    // ✅ Safe to remove
    user.addresses.splice(targetIndex, 1);
    await user.save();

    res.status(200).json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "An error occurred while trying to delete address",
    });
  }
};

export const getUserNotifications = async (req: Request, res: Response) => {
  try {
    const notifications = await Notification.find({ userId: req.userId });

    if (notifications.length === 0) {
      return res
        .status(200)
        .json({ message: "No notifications yet!", data: [] });
    }
    res.status(200).json({
      message: "User's notification fetched successfully",
      success: true,
      notifications,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "An error occured while trying to fetch user notifications",
    });
  }
};

export const getUserRecentViews = async (req: Request, res: Response) => {
  try {
    const { userId } = req;
    const limit = req.body.limit || 10;
    const recentViews = await redisService.getRecentUserViews(userId, limit);

    res.status(200).json({
      success: true,
      message: "User's recent views fetched successfully",
      recentViews,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "An error occurred while trying to fetch user's recent views",
    });
  }
};

export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const { userId } = req;
    const user = await User.findOne({ _id: userId }).select(
      "profile email addresses"
    );
    const shippingDefaultAddress = user?.addresses?.find(
      (addr) => addr.type === "shipping" && addr.isDefault
    );
    const fiatWallet = await Wallet.findOne({ userId });

    return res.status(200).json({
      success: true,
      message: "User profile fetched successfully",
      user,
      fiatWallet: fiatWallet?.balance,
      shippingDefaultAddress,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "An error occured while trying to fetch user profile",
    });
  }
};

export const getUserRecommendations = async (req: Request, res: Response) => {
  const userId = req.params.userId;

  try {
    const recommendedIds = await redisService.getUserRecommendations(
      new mongoose.Types.ObjectId(userId)
    );

    // Optional: ensure IDs are valid ObjectId instances
    const objectIds = recommendedIds.map(
      (id) => new mongoose.Types.ObjectId(id)
    );

    const detailedProducts = await Product.find({
      _id: { $in: objectIds },
    }).limit(recommendedIds.length || 10);

    res.status(200).json({ products: detailedProducts });
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    res.status(500).json({ error: "Could not fetch recommendations." });
  }
};

export const getUserOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId!.toString();
    const { page = 1, limit = 10, status } = req.query;

    const orders = await OrderService.getOrdersByUser(
      userId,
      Number(page),
      Number(limit),
      status as string
    );

    res.json({
      success: true,
      ...orders,
    });
  } catch (error) {
    next(error);
  }
};

export const addCard = async (req: Request, res: Response) => {
  try {
    const { gateway, cardDetails, billingAddress, metadata } = req.body;
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const newCard = {
      gateway,
      last4: cardDetails.last4,
      brand: cardDetails.brand,
      expMonth: cardDetails.expMonth,
      expYear: cardDetails.expYear,
      cardHolderName: cardDetails.cardHolderName,
      billingAddress,
      metadata,
      isDefault: user.paymentInformation?.cards?.length === 0, // auto default on first card
      addedAt: new Date(),
    };

    user.paymentInformation = user.paymentInformation || { cards: [] };
    user.paymentInformation.cards!.push(newCard);

    if (!user.paymentInformation.defaultGateway) {
      user.paymentInformation.defaultGateway = gateway;
    }

    await user.save();

    res.status(201).json({ success: true, message: "Card added successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error adding card" });
  }
};

export const removeCard = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const cardLast4 = req.params.last4;

    const user = await User.findById(userId);
    if (!user || !user.paymentInformation?.cards)
      return res
        .status(404)
        .json({ success: false, message: "Card not found" });

    const cards = user.paymentInformation.cards;
    const index = cards.findIndex((c) => c.last4 === cardLast4);

    if (index === -1)
      return res
        .status(404)
        .json({ success: false, message: "Card not found" });

    const wasDefault = cards[index].isDefault;
    cards.splice(index, 1);

    // Reassign default if necessary
    if (wasDefault && cards.length > 0) {
      cards[0].isDefault = true;
      user.paymentInformation.defaultGateway = cards[0].gateway;
    }

    await user.save();
    res
      .status(200)
      .json({ success: true, message: "Card removed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error removing card" });
  }
};

export const setDefaultCard = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const cardLast4 = req.body.last4;

    const user = await User.findById(userId);
    if (!user || !user.paymentInformation?.cards)
      return res
        .status(404)
        .json({ success: false, message: "User or cards not found" });

    user.paymentInformation.cards = user.paymentInformation.cards.map(
      (card) => ({
        ...card,
        isDefault: card.last4 === cardLast4,
      })
    );

    const defaultCard = user.paymentInformation.cards.find(
      (c) => c.last4 === cardLast4
    );
    if (defaultCard) {
      user.paymentInformation.defaultGateway = defaultCard.gateway;
    }

    await user.save();
    res.status(200).json({ success: true, message: "Default card updated" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Error setting default card" });
  }
};

export const updateNotificationPreferences = async (
  req: Request,
  res: Response
) => {
  try {
    const { userId } = req;
    const updatePayload = req.body; // expects partial preferences.notifications.email structure

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const defaultEmailSettings = {
      stockAlert: { type: Boolean, default: true },
      orderStatus: { type: Boolean, default: true },
      pendingReviews: { type: Boolean, default: true },
      paymentUpdates: { type: Boolean, default: true },
      newsletter: { type: Boolean, default: true },
    };

    user.preferences.notifications.email =
      user.preferences.notifications.email || defaultEmailSettings;

    type EmailKey = keyof typeof user.preferences.notifications.email;

    Object.entries(updatePayload).forEach(([key, value]) => {
      if (
        typeof value === "boolean" &&
        Object.prototype.hasOwnProperty.call(
          user.preferences.notifications.email,
          key
        )
      ) {
        user.preferences.notifications.email[key as EmailKey] = value;
      }
    });

    await user.save();

    res.status(200).json({
      success: true,
      message: "Notification preferences updated successfully",
      data: user.preferences.notifications.email,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Error updating preferences" });
  }
};

export const getFAQs = async (req: Request, res: Response) => {
  const { category, tags } = req.query;
  try {
    const filter: any = {};

    if (category) {
      filter.category = category;
    }
    if (tags) {
      const tagsArray = (tags as string).split(",").map((tag) => tag.trim());
      filter.tags = { $in: tagsArray };
    }
    const faqs = await FAQ.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: faqs });
  } catch (error) {
    console.error("Get FAQs Error:", error);
    res.status(500).json({ success: false, message: "Error fetching FAQs" });
  } 
};


export const getUserOffersForAProduct = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({ success: false, message: "Product ID is required" });
    }

    const product = await Product.findOne(
      { _id: productId, "offers.userId": userId },
      { name: 1, offers: 1 }
    );

    if (!product) {
      return res.status(404).json({ success: false, message: "No offers found for this product" });
    }

    const userOfferBlock = product.offers.find((o) => String(o.userId) === String(userId));

    res.status(200).json({
      success: true,
      data: {
        productId: product._id,
        name: product.name,
        userOffers: userOfferBlock?.userOffers || [],
        counterOffers: userOfferBlock?.counterOffers || [],
      },
    });
  } catch (error) {
    console.error("Get User Offers Error:", error);
    res.status(500).json({ success: false, message: "Error fetching user offers" });
  }
};


export const getUserOffersGrouped = async(req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;

    const products = await Product.find({ "offers.userId": userId }).select("name slug offers");

    const groupedOffers = products.map((product) => {
      const offerBlock = product.offers.find((o) => String(o.userId) === String(userId));
      return {
        productId: product._id,
        name: product.name,
        slug: product.slug,
        offers: offerBlock?.userOffers || [],
        counterOffers: offerBlock?.counterOffers || [],
      };
    });

    res.status(200).json({ success: true, data: groupedOffers });
  } catch (error) {
    next(error);
  }
}

