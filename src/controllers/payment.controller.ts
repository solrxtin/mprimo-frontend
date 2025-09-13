// controllers/payment.controller.ts
import { Request, Response, NextFunction } from "express";
import { CryptoPaymentService } from "../services/crypto-payment.service";
import { ApplePayService } from "../services/apple-pay.service";
import { StripeService } from "../services/stripe.service";
import { tokenWatcher } from "..";
import Payment from "../models/payment.model";

const cryptoService = new CryptoPaymentService();

export const createCryptoWallet = async (req: Request, res: Response) => {
  try {
    const wallet = await cryptoService.createWallet(req.userId);
    tokenWatcher.addAddressToWatch(wallet.address)

    res.status(201).json({
      success: true,
      wallet,
      message: "Wallet created successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create wallet",
    });
  }
};

export const getBalance = async (req: Request, res: Response) => {
  try {
    const { address, tokenType } = req.body;
    const balance = await cryptoService.getBalance(address, tokenType);

    res.status(200).json({
      success: true,
      balance,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve balance",
    });
  }
};

export const getUserWallet = async (req: Request, res: Response) => {
  const userId = req.userId;

  try {
    const wallet = await cryptoService.getWalletByUserId(userId);
    console.log("Wallet is ", wallet)

    res.status(200).json({
      success: true,
      wallet,
      message: "Wallet retrieved successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve wallet",
    });
  }
};

export const getPaymentAddress = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    // Generate payment details for this order

    res.status(200).json({
      success: true,
      paymentAddress: "0x...", // Your payment collection address
      amount: 100,
      currency: "USDC",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to generate payment details",
    });
  }
};

// Apple Pay payment processing
export const processApplePayPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { paymentToken, amount, currency, orderId } = req.body;
    const userId = req.userId;

    if (!paymentToken || !amount || !orderId) {
      return res.status(400).json({
        success: false,
        message: 'Payment token, amount, and order ID are required'
      });
    }

    // Process Apple Pay payment
    const paymentResult = await ApplePayService.processPayment(
      paymentToken,
      amount,
      currency || 'USD'
    );

    // Create payment record
    const payment = await Payment.create({
      userId,
      orderId,
      amount: paymentResult.amount,
      currency: paymentResult.currency,
      method: 'apple_pay',
      status: paymentResult.status,
      transactionId: paymentResult.transactionId,
      gateway: 'apple_pay',
      gatewayResponse: paymentResult,
      processedAt: new Date()
    });

    res.json({
      success: true,
      payment,
      transactionId: paymentResult.transactionId,
      message: 'Apple Pay payment processed successfully'
    });

  } catch (error) {
    next(error);
  }
};

// Create Stripe payment intent
export const createPaymentIntent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { amount, currency, paymentMethods, purpose } = req.body;

    if (!amount) {
      return res.status(400).json({
        success: false,
        message: 'Amount is required'
      });
    }

    const paymentIntent = await StripeService.createPaymentIntent(
      amount,
      currency || 'usd',
      paymentMethods || ['card', 'apple_pay'],
      {
        userId: req.userId.toString(),
        purpose: purpose || 'payment'
      }
    );

    res.json({
      success: true,
      ...paymentIntent
    });

  } catch (error) {
    next(error);
  }
};

// Process Stripe payment
export const processStripePayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { paymentIntentId, orderId } = req.body;
    const userId = req.userId;

    // Create payment record
    const payment = await Payment.create({
      userId,
      orderId,
      transactionId: paymentIntentId,
      method: 'stripe',
      status: 'completed',
      gateway: 'stripe',
      processedAt: new Date()
    });

    res.json({
      success: true,
      payment,
      message: 'Payment processed successfully'
    });

  } catch (error) {
    next(error);
  }
};

// Apple Pay session creation
export const createApplePaySession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { validationURL, domainName } = req.body;

    if (!validationURL || !domainName) {
      return res.status(400).json({
        success: false,
        message: 'Validation URL and domain name are required'
      });
    }

    const session = await ApplePayService.createPaymentSession(validationURL, domainName);

    res.json({
      success: true,
      session
    });

  } catch (error) {
    next(error);
  }
};

// controllers/payment.controller.ts
export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const { txHash, orderId, expectedAmount, recipientAddress } = req.body;

    // Verify transaction on blockchain
    const { isValid, details } = await cryptoService.verifyTransaction(
      txHash,
      expectedAmount,
      recipientAddress
    );

    if (isValid) {
      // Update order status
      // Process the payment

      res.status(200).json({
        success: true,
        message: "Payment verified",
        details,
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Invalid transaction",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to verify payment",
    });
  }
};
