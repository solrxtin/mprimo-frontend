// src/controllers/twoFactor.controller.ts
import { Request, Response } from "express";
import { TwoFactorService } from "../services/two-factor.service";
import User from "../models/user.model";
import { LoggerService } from "../services/logger.service";
import { generateTokensAndSetCookie } from "../utils/generate-token.util";
import { C } from "@upstash/redis/zmscore-CjoCv9kz";

const logger = LoggerService.getInstance();

export class TwoFactorController {
  // Initialize 2FA setup
  static async setup(req: Request, res: Response) {
    try {
      const userId = req.userId;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // if (user.twoFactorAuth.enabled) {
      //   return res.status(400).json({ message: "2FA is already enabled" });
      // }

      const { secret, qrCode } = await TwoFactorService.generateSecret(
        userId,
        user.email
      );

      res.json({
        message: "Two-factor authentication setup initiated",
        data: { secret, qrCode },
        success: true
      });
    } catch (error) {
      res.status(500).json({ message: "Error setting up 2FA", success: false});
    }
  }

  // Enable 2FA
  static async enable(req: Request, res: Response) {
    try {
      const { token } = req.body;
      const userId = req.userId;

      if (!token) {
        return res
          .status(400)
          .json({ message: "Verification code is required" });
      }

      const result = await TwoFactorService.enable2FA(userId, token);
      logger.info("Two-factor authentication enabled for user: %s", {
        user: userId,
        timestamp: new Date().toISOString(),
        userAgent: req.headers["user-agent"],
        ip: req.ip,
      });

      res.json({
        message: "Two-factor authentication enabled successfully",
        backupCodes: result.backupCodes,
        success: true
      });
    } catch (error) {
      console.error(error)
      res.status(500).json({ message: "Internal server error", success: false});
    }
  }

  // Disable 2FA
  static async disable(req: Request, res: Response) {
    try {
      const { token } = req.body;
      const userId = req.userId;

      if (!token) {
        return res
          .status(400)
          .json({ message: "Verification code is required" });
      }

      await TwoFactorService.disable2FA(userId, token);
      logger.info("Two-factor authentication disabled for user: %s", {
        user: userId,
        timestamp: new Date().toISOString(),
        userAgent: req.headers["user-agent"],
        ip: req.ip,
      });
      res.json({ message: "Two-factor authentication disabled successfully" });
    } catch (error) {
      console.error(error)
      res.status(500).json({ message: "Internal server error" });
    }
  }

  // Verify 2FA token during login
  static async verify(req: Request, res: Response) {
    try {
      const { token } = req.body;
      const userId = req.userId;

      if (!token || !userId) {
        return res.status(400).json({
          message: "User ID and verification code are required",
        });
      }

      const isValid = await TwoFactorService.validate2FALogin(userId, token);

      if (!isValid) {
        return res.status(401).json({ message: "Invalid verification code" });
      }

      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      user.activity.lastLogin = new Date();
      await user.save();

      // Generate JWT token
      await generateTokensAndSetCookie(res, user._id);

      logger.debug("User logged in successfully", {
        userId: user._id,
        timestamp: new Date().toISOString(),
        ip: req.ip,
        device: req.headers["user-agent"],
      });

      res.json({ message: "2FA verification successful", success: true, user: {...user._doc, password: undefined} });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", success: false});
    }
  }

  static async verifyBackup(req: Request, res: Response) {
    try {
      const { backupCode } = req.body;
      const userId = req.userId;
      if (!backupCode || !userId) {
        return res.status(400).json({ 
          message: 'User ID and backup code are required' 
        });
      }
  
      const isValid = await TwoFactorService.validateBackupCode(userId, backupCode);
  
      if (!isValid) {
        return res.status(401).json({ message: 'Invalid or used backup code' });
      }
  
      const user = await User.findById(userId);
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      user.activity.lastLogin = new Date();
      await user.save();
      
      // Generate JWT token
      await generateTokensAndSetCookie(res, user._id);
      
      logger.debug("User logged in with backup code", {
        userId: user._id,
        timestamp: new Date().toISOString(),
        ip: req.ip,
        device: req.headers["user-agent"],
      });
  
      res.json({ 
        message: 'Login successful with backup code', 
        success: true,
        user: {
          ...user._doc,
          password: undefined
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  }
}
