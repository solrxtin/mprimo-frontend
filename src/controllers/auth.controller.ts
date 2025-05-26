import { Response, Request } from "express";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongoose";
import bcrypt from "bcrypt";
import * as crypto from "crypto";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config()

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
import { CryptoPaymentService } from "../services/crypto-payment.service"

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
      return res.status(409).json({ message: "Email already registered" });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters long" });
    }

    if (
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/.test(req.body.password)
    ) {
      return res.status(400).json({
        message:
          "Password must contain at least one uppercase letter, one lowercase letter, and one number, and be at least 8 characters long",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = generateVerificationCode();
    console.log(verificationToken);
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
      preferences: {
        language: req.preferences?.language,
        currency: req.preferences?.currency,
        notifications: {
          email: true,
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
    const wallet = await cryptoService.createWallet(savedUser._id)
    console.log(wallet)
    logger.debug("User created successfully", {
      userId: savedUser._id,
    });

    return res.status(201).json({
      message: "User created successfully",
      user: {
        ...savedUser._doc,
        password: undefined,
      },
      wallet
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

    const has2faEnabled = user.twoFactorAuth.enabled || false;
    if (has2faEnabled) {
      return res.status(200).json({
        message: "Two-factor authentication is enabled",
        success: true,
        user: {
          ...user._doc,
          password: undefined,
        },
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

    return res.status(200).json({
      message: "Logged in successfully!",
      success: true,
      user: {
        ...user._doc,
        password: undefined,
      },
      has2faEnabled,
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
    await sendPasswordResetEmail(
      user.email,
      resetToken
    );
    logger.info("Password reset token sent successfully", {
      ip,
      userId: user._id,
    });
    res
      .status(200)
      .json({
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

    const user = await User.findOne({email});

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
      // Verify the refresh token
      const decoded = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET!
      ) as { userId: ObjectId; type: string };

      if (!decoded)
        return res.status(401).json({ message: "Invalid refresh token" });

      // Find token in database
      const storedToken = await RefreshToken.findOne({
        userId: decoded.userId,
      });

      if (!storedToken) {
        return res.status(401).json({ message: "Invalid refresh token" });
      }

      // Generate only a new access token
      const newAccessToken = generateAccessToken(decoded.userId);

      // Set only the new access token cookie
      res.cookie("accessToken", newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
        maxAge: 15 * 60 * 1000,
      });

      return res.json({
        success: true,
        accessToken: newAccessToken,
      });
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        // Only generate new refresh token if the current one is expired
       await generateTokensAndSetCookie(
          res,
          req.userId!
        );

        return res.json({
          success: true
        });
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
    //TODO: Make sure phone uses international format
    const { email, password, firstName, lastName, phoneNumber, sex } = req.body;

    // Validate input
    if (!email || !password || !firstName || !lastName || !phoneNumber || sex) {
      return res.status(400).json({
        message:
          "Email, password, phoneNumber, sex, first name, and last name are required",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
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
        sex,
      },
      role: "vendor",
      status: "active",
      preferences: {
        language: "en",
        currency: "USD",
        notifications: {
          email: true,
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
      verificationTokenExpiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
    };

    // Save user to database
    const savedUser = await User.create(newUser);
    await sendVerificationEmail(email, verificationToken);
    logger.debug("User created successfully", {
      userId: savedUser._id,
    });
    return res.status(201).json({
      message: "User created successfully",
      user: {
        ...savedUser._doc,
        password: undefined,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    logger.error("Signup error:", { error });
    return res.status(500).json({ message: "Internal server error" });
  }
};
