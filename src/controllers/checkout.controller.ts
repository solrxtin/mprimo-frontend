import { Request, Response, NextFunction } from "express";
import { StripeService } from "../services/stripe.service";
import { CryptoPaymentService } from "../services/crypto-payment.service";
import User from "../models/user.model";
import Product from "../models/product.model";
import { CartService } from "../services/cart.service";
import Country from "../models/country.model";
import { CurrencyService } from "../services/currency.service";
import Wallet from "../models/wallet.model";

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
      const currency = user?.preferences?.currency || "USD";

      // Step 4: Batch-fetch products
      const productIds = cart.map((item) => item.productId);
      const products = await Product.find({ _id: { $in: productIds } });
      const productMap = new Map(products.map((p) => [p._id.toString(), p]));

      // Step 3: Cache exchange rates
      const exchangeRates = new Map<string, number>();
      const getConvertedPrice = async (
        amount: number,
        from: string,
        to: string
      ) => {
        const key = `${from}_${to}`;
        if (!exchangeRates.has(key)) {
          const { convertedAmount, exchangeRate } =
            await CurrencyService.convertPrice(amount, from, to);
          exchangeRates.set(key, exchangeRate);
          return convertedAmount;
        }
        const rate = exchangeRates.get(key)!;
        return amount * rate;
      };

      // Step 5: Parallelize item validation
      const validatedResults = await Promise.all(
        cart.map(async (item) => {
          const errors = [];

          if (!item.productId || !item.variantId || !item.quantity) {
            errors.push("Missing productId, variantId, or quantity");
          }

          if (item.variantId && !item.optionId) {
            errors.push("Missing optionId for variant");
          }

          const product = productMap.get(item.productId.toString());
          if (!product) {
            return { item, reason: "Product not found", valid: false };
          }

          const variant = product.variants.find(
            (v: any) => v._id.toString() === item.variantId
          );
          const option = variant?.options.find(
            (opt: any) => opt._id.toString() === item.optionId
          );

          if (!option) {
            return { item, reason: "Variant not found", valid: false };
          }

          if (option.quantity < item.quantity) {
            return {
              item,
              reason: `Only ${option.quantity} available`,
              availableQuantity: option.quantity,
              valid: false,
            };
          }

          let price =
            currency !== item.vendorCurrency
              ? await getConvertedPrice(
                  item.price,
                  item.vendorCurrency ?? "USD",
                  currency
                )
              : item.price;

          const itemTotal = price * item.quantity;

          return {
            valid: true,
            validatedItem: {
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
              price,
              total: itemTotal,
              productName: product.name,
              productImage: product.images?.[0],
            },
            itemTotal,
          };
        })
      );

      const validatedItems = validatedResults
        .filter((r) => r.valid)
        .map((r) => r.validatedItem);
      const unavailableItems = validatedResults
        .filter((r) => !r.valid)
        .map((r) => ({
          ...r.item,
          reason: r.reason,
          availableQuantity: r.availableQuantity,
        }));
      const subtotal = validatedResults
        .filter((r) => r.valid && typeof r.itemTotal === "number")
        .reduce((sum, r) => sum + r.itemTotal!, 0);

      const taxRate = 0.08;
      const tax = subtotal * taxRate;
      let shipping = subtotal > 50 ? 0 : 9.99;

      if (currency !== "USD") {
        shipping = await getConvertedPrice(shipping, "USD", currency);
      }

      const total = subtotal + tax + shipping;

      const paymentMethods = await Country.find({
        currency: { $regex: new RegExp(`^${currency}$`, "i") },
      })
        .select("paymentOptions")
        .populate("paymentOptions")
        .lean();

      let userCryptoWallet = null;
      let userFiatWallet = null;

      try {
        const [cryptoWallet, fiatWallet] = await Promise.all([
          cryptoService.getWalletByUserId(userId),
          Wallet.findOne({ userId }),
        ]);

        userCryptoWallet = cryptoWallet || null;
        userFiatWallet = fiatWallet || null;
      } catch (error) {
        console.error("Error fetching user wallet", error);
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
          userCryptoWallet,
          userFiatWallet,
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
        return res.status(400).json({
          message: "An error occured while trying to validate order"
        });
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
