import { Request, Response, NextFunction } from "express";
import { StripeService } from "../services/stripe.service";
import { CryptoPaymentService } from "../services/crypto-payment.service";
import User from "../models/user.model";
import Product from "../models/product.model";
import { CartService } from "../services/cart.service";
import Country from "../models/country.model";

const cryptoService = new CryptoPaymentService();

export class CheckoutController {
  // Validate cart and prepare checkout
  static async validateCart(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;
      const cart = await CartService.getCart(userId.toString());

      if (cart.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Cart is empty for this user",
        });
      }

      const user = await User.findById(userId);
      let currency = user?.preferences?.currency || "USD";

      // Validate each item and calculate totals
      let subtotal = 0;
      const validatedItems = [];
      const unavailableItems = [];

      for (const item of cart) {
        if (!item.productId || !item.variantId || !item.quantity) {
          return res.status(400).json({
            success: false,
            message: "Each item must have productId, variantId, and quantity",
          });
        }

        if (item.variantId && !item.optionId) {
          return res.status(400).json({
            success: false,
            message: "Each item must have optionId when variantId is provided",
          });
        }

        // Get product with latest data
        const product = await Product.findById(item.productId);
        if (!product) {
          unavailableItems.push({ ...item, reason: "Product not found" });
          continue;
        }

        // Find variant and check stock
        const variant = product.variants.find(
          (v: any) => v._id.toString() === item.variantId
        );
        const option = variant?.options.find(
          (opt: any) => opt._id.toString() === item.optionId
        );

        if (!option) {
          unavailableItems.push({ ...item, reason: "Variant not found" });
          continue;
        }

        if (option.quantity < item.quantity) {
          unavailableItems.push({
            ...item,
            reason: `Only ${option.quantity} available`,
            availableQuantity: option.quantity,
          });
          continue;
        }

        const itemTotal = option.price * item.quantity;
        subtotal += itemTotal;

        validatedItems.push({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          price: option.price,
          total: itemTotal,
          productName: product.name,
          productImage: product.images?.[0],
        });
      }

      // Calculate tax and shipping (simplified)
      const taxRate = 0.08; // 8% tax
      const tax = subtotal * taxRate;
      const shipping = subtotal > 50 ? 0 : 9.99; // Free shipping over $50
      const total = subtotal + tax + shipping;

      // Get available payment methods
      const paymentMethods = await Country.find({
        currency: { $regex: new RegExp(`^${currency}$`, "i") },
      }).select("paymentOptions")
        .populate("paymentOptions")
        .lean();

      // Check crypto balance if user has wallet
      let cryptoBalance = null;
      try {
        const wallet = await cryptoService.getWalletByUserId(userId);
        if (wallet) {
          const usdcBalance = await cryptoService.getBalance(
            wallet.address,
            "usdc"
          );
          const usdtBalance = await cryptoService.getBalance(
            wallet.address,
            "usdt"
          );
          cryptoBalance = { USDC: usdcBalance, USDT: usdtBalance };
        }
      } catch (error) {
        // Crypto balance check failed, continue without it
        console.error("Error fetching user wallet");
      }

      res.json({
        success: true,
        checkout: {
          items: validatedItems,
          unavailableItems,
          pricing: {
            subtotal: Number(subtotal.toFixed(2)),
            tax: Number(tax.toFixed(2)),
            shipping: Number(shipping.toFixed(2)),
            total: Number(total.toFixed(2)),
            currency,
          },
          paymentMethods,
          cryptoBalance,
          canProceed: unavailableItems.length === 0,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Create payment intent after cart validation
  static async createPaymentIntent(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { items, paymentMethod, tokenType = "USDC" } = req.body;
      const userId = req.userId;

      // First validate cart again (prices may have changed)
      const validation = await this.validateCartInternal(items, userId);
      if (!validation.success) {
        return res.status(400).json(validation);
      }

      const { total, currency } = validation.pricing;
      let paymentData: any = {};

      switch (paymentMethod) {
        case "stripe":
        case "card":
          // Create Stripe payment intent
          const paymentIntent = await StripeService.createPaymentIntent(
            total,
            currency.toLowerCase(),
            ["card", "apple_pay"],
            {
              userId: userId.toString(),
              method: "card",
              purpose: "order-fulfillment",
            }
          );

          paymentData = {
            type: "stripe",
            clientSecret: paymentIntent.clientSecret,
            paymentIntentId: paymentIntent.paymentIntentId,
          };
          break;
        case "apple_pay":
          // Create Stripe payment intent
          const intent = await StripeService.createPaymentIntent(
            total,
            currency.toLowerCase(),
            ["card", "apple_pay"],
            {
              userId: userId.toString(),
              method: "apple_pay",
              purpose: "order-fulfillment",
            }
          );

          paymentData = {
            type: "stripe",
            clientSecret: intent.clientSecret,
            paymentIntentId: intent.paymentIntentId,
          };
          break;

        case "crypto":
          // Validate crypto balance
          const wallet = await cryptoService.getWalletByUserId(userId);
          if (!wallet) {
            return res.status(400).json({
              success: false,
              message: "Crypto wallet not found",
            });
          }

          const balance = await cryptoService.getBalance(
            wallet.address,
            tokenType.toLowerCase() as "usdc" | "usdt"
          );

          if (parseFloat(balance) < total) {
            return res.status(400).json({
              success: false,
              message: `Insufficient ${tokenType} balance. Required: ${total}, Available: ${balance}`,
            });
          }

          paymentData = {
            type: "crypto",
            tokenType,
            walletAddress: wallet.address,
            amount: total,
            balance,
          };
          break;

        default:
          return res.status(400).json({
            success: false,
            message: "Unsupported payment method",
          });
      }

      res.json({
        success: true,
        paymentData,
        checkout: validation,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      });
    } catch (error) {
      next(error);
    }
  }

  // Internal method to validate cart
  private static async validateCartInternal(items: any[], userId: any) {
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) continue;

      const variant = product.variants.find((v) =>
        v.options.some((opt) => opt.sku === item.variantId)
      );
      const option = variant?.options.find((opt) => opt.sku === item.variantId);

      if (!option || option.quantity < item.quantity) continue;

      const itemTotal = option.price * item.quantity;
      subtotal += itemTotal;

      validatedItems.push({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        price: option.price,
        total: itemTotal,
      });
    }

    const tax = subtotal * 0.08;
    const shipping = subtotal > 50 ? 0 : 9.99;
    const total = subtotal + tax + shipping;

    return {
      success: true,
      items: validatedItems,
      pricing: {
        subtotal: Number(subtotal.toFixed(2)),
        tax: Number(tax.toFixed(2)),
        shipping: Number(shipping.toFixed(2)),
        total: Number(total.toFixed(2)),
        currency: "USD",
      },
    };
  }
}
