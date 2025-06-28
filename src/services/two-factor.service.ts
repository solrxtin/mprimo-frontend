// src/services/twoFactor.service.ts
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import User from "../models/user.model";
import { Types } from "mongoose";

export class TwoFactorService {
  // Generate secret and QR code
  static async generateSecret(userId: Types.ObjectId, email: string) {
    const secret = speakeasy.generateSecret({
      name: `Emprimo:${email}`,
      length: 20,
    });

    // Save temporary secret
    await User.findByIdAndUpdate(userId, {
      "twoFactorAuth.tempSecret": secret.base32,
      "twoFactorAuth.enabled": false,
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    return {
      secret: secret.base32,
      qrCode: qrCodeUrl,
    };
  }

  // Verify TOTP token
  static verifyToken(token: string, secret: string): boolean {
    return speakeasy.totp.verify({
      secret: secret,
      encoding: "base32",
      token: token,
      window: 1, // Allow 30 seconds clock skew
    });
  }

  // Enable 2FA
  static async enable2FA(userId: Types.ObjectId, token: string) {
    const user = await User.findById(userId);
    console.log(user);
    if (!user || !user.twoFactorAuth.tempSecret) {
      throw new Error("No temporary secret found");
    }

    // Verify token before enabling
    const isValid = this.verifyToken(token, user.twoFactorAuth.tempSecret);
    if (!isValid) {
      throw new Error("Invalid verification code");
    }
    // Generate backup codes
    const backupCodes = Array(8)
      .fill(0)
      .map(() => ({
        code: Math.random().toString(36).substring(2, 8).toUpperCase(),
        used: false,
      }));

    console.log(backupCodes)

    // Enable 2FA and save secret
    await User.findByIdAndUpdate(userId, {
      "twoFactorAuth.secret": user.twoFactorAuth.tempSecret,
      "twoFactorAuth.enabled": true,
      "twoFactorAuth.tempSecret": null,
      "twoFactorAuth.backupCodes": backupCodes,
    });

    // Return backup codes to display to user
    return {
      success: true,
      backupCodes: backupCodes.map((code) => code.code),
    };
  }

  // Disable 2FA
  static async disable2FA(userId: Types.ObjectId, token: string) {
    const user = await User.findById(userId);
    if (!user || !user.twoFactorAuth.secret) {
      throw new Error("2FA is not enabled");
    }

    // Verify token before disabling
    const isValid = this.verifyToken(token, user.twoFactorAuth.secret);
    if (!isValid) {
      throw new Error("Invalid verification code");
    }

    // Disable 2FA
    await User.findByIdAndUpdate(userId, {
      "twoFactorAuth.secret": null,
      "twoFactorAuth.enabled": false,
      "twoFactorAuth.tempSecret": null,
    });

    return true;
  }

  // Validate 2FA during login
  static async validate2FALogin(userId: Types.ObjectId, token: string) {
    const user = await User.findById(userId);
    if (!user || !user.twoFactorAuth.secret) {
      throw new Error("2FA is not enabled");
    }

    return this.verifyToken(token, user.twoFactorAuth.secret);
  }

  // Use backup code 
  static async validateBackupCode(userId: Types.ObjectId, backupCode: string) {
    const user = await User.findById(userId);
    if (!user || !user.twoFactorAuth.backupCodes) {
      throw new Error("No backup codes available");
    }
  
    // Find the backup code
    const backupCodeIndex = user.twoFactorAuth.backupCodes.findIndex(
      code => code.code === backupCode && !code.used
    );
  
    if (backupCodeIndex === -1) {
      return false;
    }
  
    // Mark the backup code as used
    user.twoFactorAuth.backupCodes[backupCodeIndex].used = true;
    await user.save();
  
    return true;
  }
}
