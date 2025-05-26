import { Response, Request } from "express";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongoose";
import bcrypt from "bcrypt";
import * as crypto from "crypto";

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

const logger = LoggerService.getInstance();
const generateVerificationCode = () => Math.floor(100000 + Math.random() * 900000).toString();


export const signup = async(req: Request, res: Response): Promise<Response> => {
  try {
    //TODO: Make sure phone uses international format
    const { email, password, firstName, lastName,phoneNumber, role } = req.body;

    // Validate input
    if (!email || !password || !firstName || !lastName || !phoneNumber || !role) {
      return res.status(400).json({
        message:
          "Email, password, phoneNumber, first name, role, and last name are required",
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
        avatar: "",
      },
      role: "customer",
      status: "active",
      preferences: {
        language: "en",
        currency: "USD",
        notifications: {
          email: true,
          push: false,
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
        has2faEnabled
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
      has2faEnabled
    });
  } catch (error) {
    console.error("Login error:", error);
    logger.error("Login error:", { error });
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const verifyController = async (req: Request, res: Response) => {
  const {code} = req.body
  if (!code) {
    return res.status(400).json({ success: false, message: "Verification code is required" });
  }

  const verificationTokenHash = await bcrypt.hash(code, 10);

  try {
    const user = await User.findOne({
      verificationToken: verificationTokenHash,
      verificationTokenExpiresAt: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired verification code" });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({success: false, message: "User already verified"})
    }

    user.isEmailVerified = true;
    await user.save();

    await sendWelcomeEmail(user.profile.firstName, user.email);

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
      user: {
        ...user._doc,
        password: undefined,
      },
    });
} catch (error) {
  console.log("error in verifyEmail ", error);
  res.status(500).json({ success: false, message: "Server error" });
}
}

export const resendVerificationController = async (req: Request, res: Response) => {
  const {email} = req.body
  try {
      const user = await User.findOne({email})
      if (!user) {
          return res.status(400).json({success: false, message: "User not found"})
      }
      if (user.isEmailVerified) {
          return res.status(400).json({success: false, message: "User already verified"})
      }
      const verificationToken = generateVerificationCode()
      const verificationTokenHash = await bcrypt.hash(verificationToken, 10);

      user.verificationToken = verificationTokenHash;
      user.verificationTokenExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      await user.save()
      await sendVerificationEmail(verificationToken, email)

      res.status(200).json(
        {success: true, message: "Verification code sent successfully", user: {
          ...user._doc,
          password: null,
          verificationToken: null
      }})
  } catch (error) {
      logger.error("An error occured in resendVerificationController: ", {
        error: error instanceof Error ? error.message : "Unknown error",
        userId: req.userId,
      });
      console.error("An error occured in resendVerificationController:: ", error);
      res.status(500).json({ message: "Internal server error" });
  }
}

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
        sameSite: "strict",
        maxAge: 15 * 60 * 1000,
      });

      return res.json({
        success: true,
        accessToken: newAccessToken,
      });
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        // Only generate new refresh token if the current one is expired
        const { accessToken, refreshToken } = await generateTokensAndSetCookie(
          res,
          req.userId!
        );

        return res.json({
          success: true,
          accessToken,
          refreshToken,
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
    res.clearCookie("refreshToken", { path: "/api/v1/auth/refresh" });

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
          "If a user with that email exists, a password reset link will be sent",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = await bcrypt.hash(resetToken, 10);

    // Save reset token to user
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpiresAt = new Date(Date.now() + 900000); // 15 minutes
    await user.save();

    const ipHeader = req.headers['x-forwarded-for'];
    const ip = typeof ipHeader === 'string'
  ? ipHeader.split(',')[0].trim()
  : req.socket.remoteAddress || 'unknown';

    // send email
    await sendPasswordResetEmail(
      user.email,
      `${process.env.CLIENT_URL}/reset-password/${resetToken}`
    );
    logger.info("Password reset successful", {
      ip,
      userId: user._id,
    });
    res
      .status(200)
      .json({ success: true, message: `Password reset link sent to ${email}` });
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
    const { newPassword } = req.body;
    const resetToken = req.params.token;

    if (!resetToken) {
      return res.status(400).json({
        success: false,
        message: "No token provided!",
      });
    }

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: "No new password provided!",
      });
    }

    const hashedResetToken = await bcrypt.hash(resetToken, 10);

    const user = await User.findOne({
      resetPasswordToken: hashedResetToken,
      resetPasswordExpiresAt: { $get: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token", success: false });
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
