// src/services/twoFactor.service.ts
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import User from '../models/user.model';
import { ObjectId } from 'mongoose';

export class TwoFactorService {
  // Generate secret and QR code
  static async generateSecret(userId: ObjectId, email: string) {
    const secret = speakeasy.generateSecret({
      name: `Emprimo:${email}`,
      length: 20
    });

    // Save temporary secret
    await User.findByIdAndUpdate(userId, {
      'twoFactorAuth.tempSecret': secret.base32,
      'twoFactorAuth.enabled': false
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    return {
      secret: secret.base32,
      qrCode: qrCodeUrl
    };
  }

  // Verify TOTP token
  static verifyToken(token: string, secret: string): boolean {
    return speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 1 // Allow 30 seconds clock skew
    });
  }

  // Enable 2FA
  static async enable2FA(userId: ObjectId, token: string) {
    const user = await User.findById(userId);
    if (!user || !user.twoFactorAuth.tempSecret) {
      throw new Error('No temporary secret found');
    }

    // Verify token before enabling
    const isValid = this.verifyToken(token, user.twoFactorAuth.tempSecret);
    if (!isValid) {
      throw new Error('Invalid verification code');
    }

    // Enable 2FA and save secret
    await User.findByIdAndUpdate(userId, {
      'twoFactorAuth.secret': user.twoFactorAuth.tempSecret,
      'twoFactorAuth.enabled': true,
      'twoFactorAuth.tempSecret': null
    });

    return true;
  }

  // Disable 2FA
  static async disable2FA(userId: ObjectId, token: string) {
    const user = await User.findById(userId);
    if (!user || !user.twoFactorAuth.secret) {
      throw new Error('2FA is not enabled');
    }

    // Verify token before disabling
    const isValid = this.verifyToken(token, user.twoFactorAuth.secret);
    if (!isValid) {
      throw new Error('Invalid verification code');
    }

    // Disable 2FA
    await User.findByIdAndUpdate(userId, {
      'twoFactorAuth.secret': null,
      'twoFactorAuth.enabled': false,
      'twoFactorAuth.tempSecret': null
    });

    return true;
  }

  // Validate 2FA during login
  static async validate2FALogin(userId: ObjectId, token: string) {
    const user = await User.findById(userId);
    if (!user || !user.twoFactorAuth.secret) {
      throw new Error('2FA is not enabled');
    }

    return this.verifyToken(token, user.twoFactorAuth.secret);
  }
}
