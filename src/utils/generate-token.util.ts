import jwt from "jsonwebtoken";
import { Response } from "express";
import {Types } from "mongoose";
import RefreshToken from "../models/auth.model"

// Generate both access and refresh tokens
export const generateAccessToken = (userId: Types.ObjectId) => {
  return jwt.sign(
    { userId, type: 'access' },
    process.env.JWT_SECRET!,
    { expiresIn: '15m' }
  );
};

// Generate refresh token only when needed
export const generateRefreshToken = async (userId: Types.ObjectId) => {
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

export const generateTokensAndSetCookie = async (res: Response, userId: Types.ObjectId) => {
  const accessToken = generateAccessToken(userId);
  const refreshToken = await generateRefreshToken(userId);

  // Set access token cookie
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 15 * 60 * 1000, // 15 minutes
    path: '/'
  });

  // Set refresh token cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  return { accessToken, refreshToken };
};