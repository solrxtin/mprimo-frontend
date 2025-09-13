import speakeasy from "speakeasy";
import QRCode from "qrcode";
import User from "../models/user.model";

export const generateQRCode = async (
  userId: string,
  email: string
): Promise<string> => {
  try {
    // Generate a secret for the user
    const secret = speakeasy.generateSecret({
      name: `MPRIMO Admin (${email})`,
      issuer: "MPRIMO",
      length: 32,
    });

    // Store the temporary secret in the user document
    await User.findByIdAndUpdate(userId, {
      "twoFactorAuth.tempSecret": secret.base32,
    });

    // Generate QR code URL
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    return qrCodeUrl;
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw new Error("Failed to generate 2FA QR code");
  }
};

export const verify2FAToken = async (
  userId: string,
  token: string
): Promise<boolean> => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.twoFactorAuth.secret) {
      return false;
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorAuth.secret,
      encoding: "base32",
      token,
      window: 2, // Allow 2 time steps before/after current time
    });

    return verified;
  } catch (error) {
    console.error("Error verifying 2FA token:", error);
    return false;
  }
};

export const enable2FA = async (
  userId: string,
  token: string
): Promise<boolean> => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.twoFactorAuth.tempSecret) {
      return false;
    }

    // Verify the token with the temporary secret
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorAuth.tempSecret,
      encoding: "base32",
      token,
      window: 2,
    });

    if (verified) {
      // Move temp secret to permanent secret and enable 2FA
      user.twoFactorAuth.secret = user.twoFactorAuth.tempSecret;
      user.twoFactorAuth.tempSecret = undefined;
      user.twoFactorAuth.enabled = true;

      // Generate backup codes
      const backupCode = generateBackupCode();
      user.twoFactorAuth.backupCodes = [
        {
          code: backupCode,
          used: false,
        },
      ];

      await user.save();
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error enabling 2FA:", error);
    return false;
  }
};

export const generateBackupCode = (): string => {
  const code = Math.random().toString(36).substring(2, 10).toUpperCase();
  return code;
};

export const disable2FA = async (userId: string): Promise<boolean> => {
  try {
    await User.findByIdAndUpdate(userId, {
      "twoFactorAuth.enabled": false,
      "twoFactorAuth.secret": undefined,
      "twoFactorAuth.tempSecret": undefined,
      "twoFactorAuth.backupCodes": [],
    });
    return true;
  } catch (error) {
    console.error("Error disabling 2FA:", error);
    return false;
  }
};
