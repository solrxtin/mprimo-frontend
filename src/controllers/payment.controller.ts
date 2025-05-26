// controllers/payment.controller.ts
import { Request, Response } from 'express';
import { CryptoPaymentService } from '../services/crypto-payment.service';

const cryptoService = new CryptoPaymentService();

export const createCryptoWallet = async (req: Request, res: Response) => {
  try {
    const wallet = await cryptoService.createWallet(req.userId.toString());
    
    res.status(201).json({
      success: true,
      address: wallet.address
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create wallet"
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
      currency: "USDC"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to generate payment details"
    });
  }
};

// controllers/payment.controller.ts
export const verifyPayment = async (req: Request, res: Response) => {
    try {
      const { txHash, orderId, expectedAmount, recipientAddress } = req.body;
      
      // Verify transaction on blockchain
      const {isValid, details} = await cryptoService.verifyTransaction(txHash, expectedAmount, recipientAddress);
      
      if (isValid) {
        // Update order status
        // Process the payment
        
        res.status(200).json({
          success: true,
          message: "Payment verified",
          details
        });
      } else {
        res.status(400).json({
          success: false,
          message: "Invalid transaction"
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to verify payment"
      });
    }
  };
  