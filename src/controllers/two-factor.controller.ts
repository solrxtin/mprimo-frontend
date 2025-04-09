// src/controllers/twoFactor.controller.ts
import { Request, Response } from 'express';
import { TwoFactorService } from '../services/two-factor.service';
import  User  from '../models/user.model';
import {LoggerService} from "../services/logger.service";
import { generateTokensAndSetCookie } from '../utils/generate-token.util';

const logger = LoggerService.getInstance();

export class TwoFactorController {
  // Initialize 2FA setup
  static async setup(req: Request, res: Response) {
    try {
      const userId = req.userId;
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (user.twoFactorAuth.enabled) {
        return res.status(400).json({ message: '2FA is already enabled' });
      }

      const { secret, qrCode } = await TwoFactorService.generateSecret(
        userId,
        user.email
      );

      res.json({
        message: 'Two-factor authentication setup initiated',
        data: { secret, qrCode }
      });
    } catch (error) {
      res.status(500).json({ message: 'Error setting up 2FA' });
    }
  }

  // Enable 2FA
  static async enable(req: Request, res: Response) {
    try {
      const { token } = req.body;
      const userId = req.userId;

      if (!token) {
        return res.status(400).json({ message: 'Verification code is required' });
      }

      await TwoFactorService.enable2FA(userId, token);
      logger.info("Two-factor authentication enabled for user: %s", {
        user: userId,
        timestamp: new Date().toISOString(),
        userAgent: req.headers['user-agent'],
        ip: req.ip
      });
      
      res.json({ message: 'Two-factor authentication enabled successfully' });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  }

  // Disable 2FA
  static async disable(req: Request, res: Response) {
    try {
      const { token } = req.body;
      const userId = req.userId;

      if (!token) {
        return res.status(400).json({ message: 'Verification code is required' });
      }

      await TwoFactorService.disable2FA(userId, token);
      logger.info("Two-factor authentication disabled for user: %s", {
        user: userId,
        timestamp: new Date().toISOString(),
        userAgent: req.headers['user-agent'],
        ip: req.ip
      });
      res.json({ message: 'Two-factor authentication disabled successfully' });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  }

  // Verify 2FA token during login
  static async verify(req: Request, res: Response) {
    try {
      const { userId, token } = req.body;

      if (!token || !userId) {
        return res.status(400).json({ 
          message: 'User ID and verification code are required' 
        });
      }

      const isValid = await TwoFactorService.validate2FALogin(userId, token);

      if (!isValid) {
        return res.status(401).json({ message: 'Invalid verification code' });
      }

      const user = await User.findById({userId});

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
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

      res.json({ message: '2FA verification successful', success: true});
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  }
}
