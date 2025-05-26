// services/crypto-payment.service.ts
import { ethers } from 'ethers';
import CryptoWallet from '../models/cryptoWallet.model';
import {decrypt, encrypt} from '../utils/encryption';
import { ObjectId } from 'mongoose';

// ABI for USDC/USDT ERC20 tokens
const tokenABI = [
  "function transfer(address to, uint amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint)"
];

export class CryptoPaymentService {
  private provider: ethers.JsonRpcProvider;
  private usdcAddress: string;
  private usdtAddress: string;
  
  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL);
    this.usdcAddress = process.env.USDC_CONTRACT_ADDRESS || '';
    this.usdtAddress = process.env.USDT_CONTRACT_ADDRESS || '';
  }

  async createWallet(userId: ObjectId) {
    try {
      // Validate userId
      if (!userId) {
        throw new Error('User ID is required to create a wallet');
      }
      
      const wallet = ethers.Wallet.createRandom();
      
      // Validate that wallet and privateKey exist before encrypting
      if (!wallet || !wallet.privateKey) {
        throw new Error('Failed to generate wallet or private key');
      }
      
      const newWallet = await CryptoWallet.create({
        userId,
        address: wallet.address,
        privateKey: encrypt(wallet.privateKey) // Encrypted
      });
      
      return newWallet;
    } catch (error) {
      console.error('Error creating wallet:', error);
      throw error;
    }
  }

  async getBalance(address: string, tokenAddress: string) {
    const contract = new ethers.Contract(tokenAddress, tokenABI, this.provider);
    const balance = await contract.balanceOf(address);
    return ethers.formatUnits(balance, 6); // USDC/USDT use 6 decimals
  }

  async verifyTransaction(txHash: string, expectedAmount: string, recipientAddress: string) {
    try {
      // Wait for transaction to be mined and confirmed
      const tx = await this.provider.getTransaction(txHash);
      if (!tx) {
        throw new Error('Transaction not found');
      }
  
      // Wait for 3 confirmations for better security
      const receipt = await this.provider.waitForTransaction(txHash, 3);
      if (!receipt || receipt.status === 0) {
        throw new Error('Transaction failed or reverted');
      }
  
      // Determine which token contract to use
      const tokenAddress = tx.to?.toLowerCase() === this.usdcAddress.toLowerCase() 
        ? this.usdcAddress 
        : this.usdtAddress;
  
      if (!tokenAddress) {
        throw new Error('Invalid token contract');
      }
  
      // Create contract interface to decode transaction data
      const contract = new ethers.Contract(tokenAddress, tokenABI, this.provider);
      const decodedData = contract.interface.parseTransaction({ data: tx.data });
  
      // Verify the transaction details
      const isValidRecipient = decodedData!.args[0].toLowerCase() === recipientAddress.toLowerCase();
      const receivedAmount = ethers.formatUnits(decodedData!.args[1], 6);
      const isValidAmount = receivedAmount === expectedAmount;
  
      // Return detailed verification result
      return {
        isValid: isValidRecipient && isValidAmount,
        details: {
          confirmations: receipt.confirmations,
          receivedAmount,
          recipient: decodedData!.args[0],
          tokenType: tokenAddress === this.usdcAddress ? 'USDC' : 'USDT'
        }
      };
  
    } catch (error) {
      console.error("Error verifying transaction:", error);
      throw error;
    }
  }

  async signTransaction(userId: string, to: string, amount: string, tokenType: 'USDC' | 'USDT') {
    // Get user's wallet from database
    const wallet = await CryptoWallet.findOne({ userId });
    if (!wallet) {
      throw new Error('Wallet not found for user');
    }
    
    // Decrypt the private key
    const privateKey = decrypt(wallet.privateKey);
    
    // Create wallet instance with the private key
    const signer = new ethers.Wallet(privateKey, this.provider);
    
    // Determine which token to use
    const tokenAddress = tokenType === 'USDC' ? this.usdcAddress : this.usdtAddress;
    
    // Create contract instance
    const contract = new ethers.Contract(tokenAddress, tokenABI, signer);
    
    // Convert amount to token units (USDC/USDT use 6 decimals)
    const tokenAmount = ethers.parseUnits(amount, 6);
    
    // Create and sign the transaction
    const tx = await contract.transfer(to, tokenAmount);
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    
    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      from: wallet.address,
      to: to,
      amount: amount,
      tokenType: tokenType
    };
  }
  
  
}


