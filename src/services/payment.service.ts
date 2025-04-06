// payment.service.ts
import axios from 'axios';
import { LoggerService } from './logger.service';
import mongoose from 'mongoose';

interface PaymentRequest {
  amount: number;
  currency: string;
  paymentMethod: string;
  user: mongoose.Schema.Types.ObjectId;
  metadata?: Record<string, any>;
}

interface PaymentResult {
  success: boolean;
  message: string;
  transactionId?: string;
  paymentStatus?: string;
  retryable?: boolean; 
}

interface RefundRequest {
    transactionId: string;
    amount: number;
    currency?: string;
    reason?: string;
  }
  
  interface RefundResult {
    success: boolean;
    message: string;
    refundId?: string;
    newBalance?: number;
  }

export class PaymentService {
  private logger = LoggerService.getInstance();
  private apiBaseUrl = process.env.PAYMENT_GATEWAY_URL || 'https://api.paymentprovider.com/v1';

  // Existing refund method...
  
  async processPayment(paymentRequest: PaymentRequest): Promise<PaymentResult> {
    try {
      this.logger.info(`Processing payment for user ${paymentRequest.user}`);

      // Validate payment data
      if (paymentRequest.amount <= 0) {
        throw new Error('Payment amount must be positive');
      }

      if (!['credit_card', 'paypal', 'bank_transfer'].includes(paymentRequest.paymentMethod)) {
        throw new Error('Invalid payment method');
      }

      // Prepare payment payload
      const payload = {
        amount: Math.round(paymentRequest.amount * 100), // Convert to cents
        currency: paymentRequest.currency.toLowerCase(),
        payment_method: paymentRequest.paymentMethod,
        customer_id: paymentRequest.user,
        metadata: {
          ...paymentRequest.metadata,
          system: 'mprimo-ecommerce'
        }
      };

      // Call payment gateway API
      const response = await axios.post(`${this.apiBaseUrl}/charges`, payload, {
        headers: {
          'Authorization': `Bearer ${process.env.PAYMENT_GATEWAY_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000 // 15 second timeout
      });

      // Handle response
      if (response.data.status === 'succeeded') {
        this.logger.info(`Payment processed successfully: ${response.data.transaction_id}`);
        return {
          success: true,
          message: 'Payment processed successfully',
          transactionId: response.data.transaction_id,
          paymentStatus: response.data.status
        };
      } else {
        // Handle pending/processing statuses
        if (response.data.status === 'pending') {
          return {
            success: true,
            message: 'Payment is processing',
            transactionId: response.data.transaction_id,
            paymentStatus: response.data.status
          };
        }
        throw new Error(response.data.error_message || 'Payment processing failed');
      }
    } catch (error) {
      this.logger.error(`Payment processing failed: ${(error as Error).message}`);
      
      let errorMessage = 'Payment processing error';
      let shouldRetry = false;

      const isAxiosError = axios.isAxiosError(error);
      if (isAxiosError && error.response) {
        // Payment gateway error response
        errorMessage = error.response.data?.message || 
                      `Payment gateway error: ${error.response.status}`;
        
        // Mark certain errors as retryable (e.g., timeout errors)
        shouldRetry = [408, 429, 502, 503, 504].includes(error.response.status);
      } else if (isAxiosError && error.request) {
        // No response received
        errorMessage = 'No response from payment gateway';
        shouldRetry = true;
      } else {
        // Configuration error
        errorMessage = (error as Error).message;
      }

      return {
        success: false,
        message: errorMessage,
        ...(shouldRetry && { retryable: true })
      };
    }
  }



  // Refund method (i dont know if we will use it)
  async processRefund(refundRequest: RefundRequest): Promise<RefundResult> {
    try {
      this.logger.info(`Initiating refund for transaction ${refundRequest.transactionId}`);

      // Validate refund amount
      if (refundRequest.amount <= 0) {
        throw new Error('Refund amount must be positive');
      }

      // Call payment gateway API
      const response = await axios.post(`${this.apiBaseUrl}/refunds`, {
        transaction_id: refundRequest.transactionId,
        amount: Math.round(refundRequest.amount * 100), // Convert to cents
        currency: refundRequest.currency || 'USD',
        reason: refundRequest.reason || 'customer_request'
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.PAYMENT_GATEWAY_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      });

      if (response.data.status === 'succeeded') {
        this.logger.info(`Refund processed successfully: ${response.data.refund_id}`);
        return {
          success: true,
          message: 'Refund processed successfully',
          refundId: response.data.refund_id,
          newBalance: response.data.new_balance
        };
      } else {
        throw new Error(response.data.error_message || 'Refund processing failed');
      }
    } catch (error) {
      this.logger.error(`Refund failed for transaction ${refundRequest.transactionId}: ${(error as Error).message}`);
      
      // Handle specific error cases
      let errorMessage = 'Payment processing error';
      if (axios.isAxiosError(error) && error.response) {
        // The request was made and the server responded with a status code
        errorMessage = error.response.data?.message || 
                      `Payment gateway error: ${error.response.status}`;
      } else if (axios.isAxiosError(error) && error.request) {
        // The request was made but no response was received
        errorMessage = 'No response from payment gateway';
      }

      return {
        success: false,
        message: errorMessage
      };
    }
  }

}