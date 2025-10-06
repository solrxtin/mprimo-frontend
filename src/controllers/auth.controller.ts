import { Response, Request } from "express";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

import RefreshToken from "../models/auth.model";
import {
  generateAccessToken,
  generateTokensAndSetCookie,
} from "../utils/generate-token.util";
import { LoggerService } from "../services/logger.service";
import User from "../models/user.model";
import sendPasswordResetEmail from "../mails/send-reset-password.mail";
import sendPasswordResetSuccessfulEmail from "../mails/send-password-reset-successful.mail";
import sendVerificationEmail from "../mails/send-verification.mail";
import sendWelcomeEmail from "../mails/send-welcome-message.mail";
import { CryptoPaymentService } from "../services/crypto-payment.service";
import getCountryPreferences from "../utils/get-country-preferences";
import Vendor from "../models/vendor.model";
import { tokenWatcher } from "..";
import { IVendor } from "../types/vendor.type";
import AuditLogService from "../services/audit-log.service";
import { SubscriptionService } from "../services/subscription.service";
import Wallet from "../models/wallet.model";
import { StripeVerificationService } from "../services/stripe-verification.service";
import Country from "../models/country.model";

const logger = LoggerService.getInstance();
const generateVerificationCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString();
const cryptoService = new CryptoPaymentService();

export const signup = async (req: Request, res: Response) => {
  try {
    //TODO: Make sure phone uses international format
    const { email, password, firstName, lastName, phoneNumber } = req.body;

    // Validate input
    if (!email || !password || !firstName || !lastName || !phoneNumber) {
      return res.status(400).json({
        message:
          "Email, password, phoneNumber, first name, and last name are required",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      await AuditLogService.log(
        "REGISTRATION_ATTEMPT_DUPLICATE_EMAIL",
        "auth",
        "warning",
        { email, attemptedRole: "personal" },
        req
      );
      return res.status(409).json({ message: "Email already registered" });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters long" });
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(req.body.password)) {
      return res.status(400).json({
        message:
          "Password must contain at least one uppercase letter, one lowercase letter, and one number, and be at least 8 characters long",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = generateVerificationCode();
    const verificationTokenHash = await bcrypt.hash(verificationToken, 10);

    // Create new user
    const newUser = {
      email,
      password: hashedPassword,
      profile: {
        firstName,
        lastName,
        phoneNumber: phoneNumber,
        avatar:
          "https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.pngwing.com%2Fen%2Fsearch%3Fq%3Ddefault&psig=AOvVaw0lcae7FB-Vd4hXMHi_VoGC&ust=1747319513029000&source=images&cd=vfe&opi=89978449&ved=0CBEQjRxqFwoTCOiUucqWo40DFQAAAAAdAAAAABAE",
      },
      role: "personal",
      status: "active",
      country: req.preferences?.country,
      preferences: {
        language: req.preferences?.language,
        currency: req.preferences?.currency,
        notifications: {
          email: {
            stockAlert: true,
            orderStatus: true,
            pendingReviews: true,
            paymentUpdates: true,
            newsletter: false,
          },
          push: true,
          sms: false,
        },
        marketing: false,
      },
      activity: {
        lastLogin: new Date(),
        totalOrders: 0,
        totalSpent: 0,
      },
      verificationToken: verificationTokenHash,
      verificationTokenExpiresAt: Date.now() + 2 * 60 * 1000, // 2 minutes
    };

    await sendVerificationEmail(email, verificationToken);

    // Save user to database
    const savedUser = await User.create(newUser);
    const wallet = await cryptoService.createWallet(savedUser._id);
    const fiatWallet = await Wallet.create({
      userId: savedUser._id,
      currency: req.preferences.currency,
    });
    tokenWatcher.addAddressToWatch(wallet.address);
    logger.debug("User created successfully", {
      userId: savedUser._id,
    });

    // Log successful registration
    await AuditLogService.log(
      "USER_REGISTERED",
      "auth",
      "info",
      {
        userId: savedUser._id,
        email: savedUser.email,
        role: savedUser.role,
        hasWallet: !!wallet,
      },
      req,
      savedUser._id.toString()
    );

    return res.status(201).json({
      message: "User created successfully",
      user: {
        ...savedUser._doc,
        password: undefined,
      },
      cryptoWallet: wallet,
      fiatWallet,
    });
  } catch (error) {
    console.error("Signup error:", error);
    logger.error("Signup error:", { error });

    // Handle Mongoose validation errors
    if (error instanceof mongoose.Error.ValidationError) {
      const validationErrors: Record<string, string> = {};

      // Extract validation messages
      Object.values(error.errors).forEach((err) => {
        validationErrors[err.path] = err.message;
      });

      return res.status(400).json({
        message: "Validation failed",
        errors: validationErrors,
      });
    }

    // Handle other errors
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password || "");
    if (!isValidPassword) {
      if (user.socialLogins && user.socialLogins.length > 0) {
        return res
          .status(400)
          .json({ message: "Try a different means of login" });
      }
      return res.status(401).json({ message: "Invalid credentials" });
    }

    let vendor: IVendor | null = null;
    if (
      (user.role === "personal" && user.canMakeSales) ||
      user.role === "business"
    ) {
      const proposedVendor = await Vendor.findOne({ userId: user._id });
      vendor = proposedVendor ? proposedVendor : null;
    }

    const has2faEnabled = user.twoFactorAuth.enabled || false;
    if (has2faEnabled) {
      return res.status(200).json({
        message: "Two-factor authentication is enabled",
        success: true,
        user: {
          ...user._doc,
          password: undefined,
        },
        vendor,
        has2faEnabled,
      });
    }

    // Update last login
    user.activity.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    await generateTokensAndSetCookie(res, user._id);
    logger.debug("User logged in successfully", {
      userId: user._id,
      ip: req.ip,
      device: req.headers["user-agent"],
    });

    // Log successful login
    await AuditLogService.log(
      "USER_LOGIN_SUCCESS",
      "auth",
      "info",
      {
        userId: user._id,
        email: user.email,
        role: user.role,
        country: req.headers["cf-ipcountry"] || "unknown",
      },
      req,
      user._id.toString()
    );

    return res.status(200).json({
      message: "Logged in successfully!",
      success: true,
      user: {
        ...user._doc,
        password: undefined,
      },
      vendor,
      has2faEnabled,
      requires2FA: true,
    });
  } catch (error) {
    console.error("Login error:", error);
    logger.error("Login error:", { error });
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const verifyController = async (req: Request, res: Response) => {
  const { code } = req.body;
  if (!code) {
    return res
      .status(400)
      .json({ success: false, message: "Verification code is required" });
  }

  const newDate = new Date(Date.now());

  // Find users with non-expired tokens first
  try {
    const users = await User.find({
      verificationTokenExpiresAt: { $gt: newDate },
    });

    // Then check each user's token with bcrypt.compare
    let validUser = null;
    for (const user of users) {
      const isValidToken = await bcrypt.compare(code, user.verificationToken);
      if (isValidToken) {
        validUser = user;
        break;
      }
    }

    if (!validUser) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code",
      });
    }

    if (validUser.isEmailVerified) {
      return res
        .status(400)
        .json({ success: false, message: "User already verified" });
    }

    validUser.isEmailVerified = true;
    await validUser.save();
    await sendWelcomeEmail(validUser.email, validUser.profile.firstName);

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
      user: {
        ...validUser._doc,
        password: undefined,
      },
    });
  } catch (error) {
    console.log("error in verifyEmail ", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const resendVerificationController = async (
  req: Request,
  res: Response
) => {
  const { email } = req.body;
  console.log(email);
  if (!email) {
    return res
      .status(400)
      .json({ success: false, message: "Email is required" });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }
    if (user.isEmailVerified) {
      return res
        .status(400)
        .json({ success: false, message: "User already verified" });
    }
    const verificationToken = generateVerificationCode();
    const verificationTokenHash = await bcrypt.hash(verificationToken, 10);

    user.verificationToken = verificationTokenHash;
    user.verificationTokenExpiresAt = new Date(Date.now() + 2 * 60 * 1000); // 5 minutes

    await user.save();
    await sendVerificationEmail(email, verificationToken);

    res.status(200).json({
      success: true,
      message: "Verification code sent successfully",
      user: {
        ...user._doc,
        password: null,
        verificationToken: null,
      },
    });
  } catch (error) {
    logger.error("An error occured in resendVerificationController: ", {
      error: error instanceof Error ? error.message : "Unknown error",
      userId: req.userId,
    });
    console.error("An error occured in resendVerificationController:: ", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const requestPasswordChange = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    const user = await User.findOne({ email });

    // Don't reveal if user exists or not
    if (!user) {
      return res.status(200).json({
        message:
          "If a user with this email exists, a password reset link will be sent",
      });
    }

    await AuditLogService.log(
      "PASSWORD_CHANGE_REQUESTED",
      "auth",
      "info",
      {
        userId: user._id,
        email: user.email,
        role: user.role,
        country: req.headers["cf-ipcountry"] || "unknown",
      },
      req,
      user._id.toString()
    );

    // Generate reset token
    const resetToken = generateVerificationCode();
    const resetTokenHash = await bcrypt.hash(resetToken, 10);

    // Save reset token to user
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpiresAt = new Date(Date.now() + 120000); // 2 minutes
    await user.save();

    const ipHeader = req.headers["x-forwarded-for"];
    const ip =
      typeof ipHeader === "string"
        ? ipHeader.split(",")[0].trim()
        : req.socket.remoteAddress || "unknown";

    // send email
    await sendPasswordResetEmail(user.email, resetToken);
    logger.info("Password reset token sent successfully", {
      ip,
      userId: user._id,
    });
    res.status(200).json({
      success: true,
      message: `Password reset token sent to the specified token`,
      user: { ...user, password: undefined },
    });
  } catch (error: unknown) {
    logger.error("Password reset request failed", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "An error occurred while processing your request",
    });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const { newPassword, email } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: "No new password provided!",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(400)
        .json({ message: "User not found", success: false });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedNewPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiresAt = undefined;

    await user.save();

    const ipHeader = req.headers["x-forwarded-for"];
    const ip =
      typeof ipHeader === "string"
        ? ipHeader.split(",")[0].trim()
        : req.socket.remoteAddress || "unknown";

    await sendPasswordResetSuccessfulEmail(user.email);
    logger.info("Password reset successful", {
      ip,
      userId: user._id,
    });

    await AuditLogService.log(
      "PASSWORD_CHANGED",
      "auth",
      "info",
      {
        userId: user._id,
        email: user.email,
        role: user.role,
        country: req.headers["cf-ipcountry"] || "unknown",
      },
      req,
      user._id.toString()
    );

    return res.status(200).json({
      message: "Password reset successful",
      success: true,
    });
  } catch (error) {
    logger.error("Password reset failed", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "An error occurred while processing your request",
    });
  }
};

export const verifyPasswordResetEmail = async (req: Request, res: Response) => {
  const { code } = req.body;
  if (!code) {
    return res
      .status(400)
      .json({ success: false, message: "Token is required" });
  }

  const newDate = new Date(Date.now());

  // Find users with non-expired tokens first
  try {
    const users = await User.find({
      resetPasswordExpiresAt: { $gt: newDate },
    });

    // Then check each user's token with bcrypt.compare
    let validUser = null;
    for (const user of users) {
      const isValidToken = await bcrypt.compare(code, user.resetPasswordToken!);
      if (isValidToken) {
        validUser = user;
        break;
      }
    }

    if (!validUser) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired token",
      });
    }
    await validUser.save();

    res.status(200).json({
      success: true,
      message: "Token matched",
      user: {
        ...validUser._doc,
        password: undefined,
      },
    });
  } catch (error) {
    console.log("error in verifyPasswordResetEmail ", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const resendPasswordChangeEmail = async (
  req: Request,
  res: Response
) => {
  const { email } = req.body;
  if (!email) {
    return res
      .status(400)
      .json({ success: false, message: "Email is required" });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }
    const resetPasswordToken = generateVerificationCode();
    const resetPasswordTokenHash = await bcrypt.hash(resetPasswordToken, 10);

    user.resetPasswordToken = resetPasswordTokenHash;
    user.resetPasswordExpiresAt = new Date(Date.now() + 2 * 60 * 1000); // 5 minutes

    await user.save();
    await sendPasswordResetEmail(email, resetPasswordToken);

    res.status(200).json({
      success: true,
      message: "Token sent successfully",
      user: {
        ...user._doc,
        password: null,
        verificationToken: null,
      },
    });
  } catch (error) {
    logger.error("An error occured in resendPasswordChangeEmail: ", {
      error: error instanceof Error ? error.message : "Unknown error",
      userId: req.userId,
    });
    console.error("An error occured in resendPasswordChangeEmail:: ", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const refreshAccessToken = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token not found" });
    }

    try {
      // First verify the token without hitting the database
      const decoded = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET!
      ) as { userId: Types.ObjectId; type: string; exp: number };

      // Check token type
      if (decoded.type !== "refresh") {
        return res.status(401).json({ message: "Invalid token type" });
      }

      // Generate a new access token
      const newAccessToken = generateAccessToken(decoded.userId);

      // Set the new access token cookie
      res.cookie("accessToken", newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // Updated for cross-site compatibility
        path: "/", // Ensure cookie is available across the site
        maxAge: 15 * 60 * 1000, // 15 minutes
      });

      // Only check the database periodically (e.g., when token is close to expiry)
      // This reduces database load for frequent token refreshes
      const tokenExpiryTime = decoded.exp * 1000; // Convert to milliseconds
      const timeUntilExpiry = tokenExpiryTime - Date.now();
      const refreshThreshold = 24 * 60 * 60 * 1000; // 1 day in milliseconds

      // Only verify against database if token is close to expiry or randomly (10% chance)
      if (timeUntilExpiry < refreshThreshold || Math.random() < 0.1) {
        const storedToken = await RefreshToken.findOne({
          userId: decoded.userId,
          token: refreshToken,
        });

        if (!storedToken) {
          // Token was revoked or doesn't exist
          res.clearCookie("accessToken");
          res.clearCookie("refreshToken");
          return res.status(401).json({ message: "Invalid refresh token" });
        }
      }

      return res.json({
        success: true,
        accessToken: newAccessToken,
      });
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        // Token has expired, clear cookies
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        return res.status(401).json({ message: "Refresh token expired" });
      }

      return res.status(401).json({ message: "Invalid refresh token" });
    }
  } catch (error) {
    logger.error("Token refresh failed", {
      error: error instanceof Error ? error.message : "Unknown error",
      userId: req.userId,
    });
    console.error("Token refresh error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      // Using findOneAndDelete to ensure we found and deleted the token
      const deletedToken = await RefreshToken.findOneAndDelete({
        token: refreshToken,
      });

      if (!deletedToken) {
        // Optional: Log that token wasn't found
        console.warn("Refresh token not found in database during logout");
        logger.warn("Refresh token not found in database during logout", {
          userId: req.userId,
          ip: req.ip,
          userAgent: req.headers["user-agent"],
        });
      }
    }

    // Clear cookies
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    logger.debug("User logged out", {
      userId: req.userId,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    logger.error("Logout error occurred", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      userId: req.userId,
    });
    console.error("Logout error:", error);
    res.status(500).json({ message: "Error during logout" });
  }
};

interface IAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

// Vendor
export const signupVendor = async (req: Request, res: Response) => {
  try {
    const {
      businessName,
      businessEmail,
      password,
      country,
      street,
      city,
      state,
      postalCode,
    } = req.body;

    console.log(req.body);

    // Validate input
    if (
      !businessEmail ||
      !password ||
      !businessName ||
      !country ||
      !street ||
      !city ||
      !state ||
      !postalCode
    ) {
      return res.status(400).json({
        message:
          "Business email, Business name, password, country, street, city, state, postalCode are required",
      });
    }

    const allowedCountry = await Country.findOne({
      name: { $regex: new RegExp(`^${country}$`, "i") },
    });
    if (!allowedCountry) {
      await AuditLogService.log(
        "VENDOR_REGISTRATION_ATTEMPT_UNSUPPORTED_COUNTRY",
        "auth",
        "info",
        {
          userId: req.userId,
          email: businessEmail,
          country: country,
        },
        req,
        req.userId.toString() || "unknown"
      );
      return res.status(400).json({ message: "Country is not supported" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: businessEmail });
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "Business email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const preferences = getCountryPreferences(country);

    // Create new user
    const newUser = {
      email: businessEmail,
      password: hashedPassword,
      businessName: businessName,
      country: country,
      role: "business",
      status: "active",
      canMakeSales: true,
      preferences: {
        language: preferences.language,
        currency: preferences.currency,
        notifications: {
          email: {
            stockAlert: true,
            orderStatus: true,
            pendingReviews: true,
            paymentUpdates: true,
            newsletter: false,
          },
          push: true,
          sms: false,
        },
        marketing: false,
      },
      activity: {
        lastLogin: new Date(),
        totalOrders: 0,
        totalSpent: 0,
      },
    };

    // Save user to database
    const savedUser = await User.create(newUser);
    const wallet = await cryptoService.createWallet(savedUser._id);
    tokenWatcher.addAddressToWatch(wallet.address);
    logger.debug("User created successfully", {
      userId: savedUser._id,
    });

    const vendor = await Vendor.create({
      userId: savedUser._id,
      accountType: "business",
      businessInfo: {
        name: businessName,
        address: {
          city,
          street,
          state,
          country,
          postalCode,
        },
      },
    });

    await AuditLogService.log(
      "SIGNUP",
      "auth",
      "info",
      {
        userId: savedUser._id,
        email: savedUser.email,
        role: savedUser.role,
        country: req.headers["cf-ipcountry"] || "unknown",
        vendor: vendor._id,
      },
      req,
      savedUser._id.toString()
    );
    await SubscriptionService.initializeVendorSubscription(
      vendor._id.toString()
    );
    const rawCountry = req.headers["cf-ipcountry"];
    const reqCountry = Array.isArray(rawCountry) ? rawCountry[0] : rawCountry || "US";

    const userData = {
      email: businessEmail,
      country: reqCountry,
      businessType: "company",
      companyName: businessName,
    } as const;
    const { success, accountId, account, error } =
      await StripeVerificationService.createCustomAccount(userData);

    console.log(success, accountId, account, error);

    let linkResult;

    if (success && accountId && account) {
      // wait for the onboarding link (needed for response)
      linkResult = await StripeVerificationService.createAccountLink(
        accountId,
        `${process.env.FRONTEND_URL}/vendor/verification/refresh`,
        `${process.env.FRONTEND_URL}/vendor/verification/complete`
      );

      // fire-and-forget vendor save
      (async () => {
        try {
          vendor.stripeAccountId = accountId;
          await vendor.save();
        } catch (err) {
          console.error("Failed to save vendor with stripeAccountId:", err);
        }
      })();
    }

    return res.status(201).json({
      message:
        "Business created successfully. Please proceed with verification",
      user: {
        ...savedUser._doc,
        password: undefined,
        vendor,
      },
      onboardingLink: linkResult?.url || null,
      accountId: accountId || null,
    });
  } catch (error) {
    console.error("Signup error:", error);
    logger.error("Signup error:", { error });
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Apple Sign In
// export const appleLogin = async (req: Request, res: Response) => {
//   try {
//     const { identityToken, user } = req.body;

//     if (!identityToken) {
//       return res.status(400).json({ message: 'Identity token is required' });
//     }

//     // Verify Apple identity token
//     const applePublicKeys = await getApplePublicKeys();
//     const decodedToken = await verifyAppleToken(identityToken, applePublicKeys);

//     if (!decodedToken) {
//       return res.status(401).json({ message: 'Invalid Apple token' });
//     }

//     const appleUserId = decodedToken.sub;
//     const email = decodedToken.email;

//     // Check if user exists
//     let existingUser = await User.findOne({
//       $or: [
//         { email: email },
//         { 'socialLogins.provider': 'apple', 'socialLogins.providerId': appleUserId }
//       ]
//     });

//     if (existingUser) {
//       // Update social login info if not present
//       if (!existingUser.socialLogins.some(login => login.provider === 'apple')) {
//         existingUser.socialLogins.push({
//           provider: 'apple',
//           providerId: appleUserId,
//           email: email
//         });
//         await existingUser.save();
//       }
//     } else {
//       // Create new user
//       const preferences = getCountryPreferences(req.headers['cf-ipcountry'] as string || 'US');

//       existingUser = await User.create({
//         email: email,
//         profile: {
//           firstName: user?.name?.firstName || 'Apple',
//           lastName: user?.name?.lastName || 'User',
//           avatar: 'https://via.placeholder.com/150'
//         },
//         role: 'personal',
//         status: 'active',
//         isEmailVerified: true,
//         socialLogins: [{
//           provider: 'apple',
//           providerId: appleUserId,
//           email: email
//         }],
//         preferences: {
//           language: preferences.language,
//           currency: preferences.currency,
//           notifications: {
//             email: true,
//             push: true,
//             sms: false
//           },
//           marketing: false
//         },
//         activity: {
//           lastLogin: new Date(),
//           totalOrders: 0,
//           totalSpent: 0
//         }
//       });

//       const wallet = await cryptoService.createWallet(existingUser._id);
//       tokenWatcher.addAddressToWatch(wallet.address);
//     }

//     existingUser.activity.lastLogin = new Date();
//     await existingUser.save();

//     let vendor = null;
//     if ((existingUser.role === 'personal' && existingUser.canMakeSales) || existingUser.role === 'business') {
//       vendor = await Vendor.findOne({ userId: existingUser._id });
//     }

//     await generateTokensAndSetCookie(res, existingUser._id);

//     await AuditLogService.log(
//       'APPLE_LOGIN_SUCCESS',
//       'auth',
//       'info',
//       {
//         userId: existingUser._id,
//         email: existingUser.email,
//         role: existingUser.role
//       },
//       req,
//       existingUser._id.toString()
//     );

//     res.json({
//       success: true,
//       message: 'Apple login successful',
//       user: {
//         ...existingUser._doc,
//         password: undefined
//       },
//       vendor,
//       has2faEnabled: existingUser.twoFactorAuth?.enabled || false
//     });

//   } catch (error) {
//     console.error('Apple login error:', error);
//     logger.error('Apple login error:', { error });
//     res.status(500).json({ message: 'Internal server error' });
//   }
// };

// // Helper functions
// async function getApplePublicKeys() {
//   const response = await axios.get('https://appleid.apple.com/auth/keys');
//   return response.data.keys;
// }

async function verifyAppleToken(token: string, publicKeys: any[]) {
  try {
    const decodedHeader = jwt.decode(token, { complete: true });
    if (!decodedHeader) return null;

    const kid = decodedHeader.header.kid;
    const publicKey = publicKeys.find((key) => key.kid === kid);
    if (!publicKey) return null;

    const jwkToPem = require("jwk-to-pem");
    const pem = jwkToPem(publicKey);

    return jwt.verify(token, pem, {
      algorithms: ["RS256"],
      audience: process.env.APPLE_CLIENT_ID,
      issuer: "https://appleid.apple.com",
    });
  } catch (error) {
    return null;
  }
}
