import jwt from "jsonwebtoken";
import { Response } from "express";
import { ObjectId } from "mongoose";
import RefreshToken from "../models/auth.model"

// Generate both access and refresh tokens
export const generateAccessToken = (userId: ObjectId) => {
  return jwt.sign(
    { userId, type: 'access' },
    process.env.JWT_SECRET || (() => { throw new Error("JWT_SECRET is not defined in environment variables"); })(),
    { expiresIn: '15m' }
  );
};

// Generate refresh token only when needed
export const generateRefreshToken = async (userId: ObjectId) => {
  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    process.env.REFRESH_TOKEN_SECRET!,
    { expiresIn: '7d' }
  );

  await RefreshToken.findOneAndUpdate(
    { userId }, // find by userId
    {  // update these fields
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    },
    { upsert: true } // create if doesn't exist
  );

  return refreshToken;
};

export const generateTokensAndSetCookie = async (res: Response, userId: ObjectId) => {
  const accessToken = generateAccessToken(userId);
  const refreshToken = await generateRefreshToken(userId);

  // Set access token cookie
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000 // 15 minutes
  });

  // Set refresh token cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/v1/auth/refresh', // Only sent to refresh endpoint
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  return { accessToken, refreshToken };
};
