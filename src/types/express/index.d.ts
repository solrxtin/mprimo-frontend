import { Schema, Types } from "mongoose";
import session from "express-session";

declare module "express-session" {
  interface SessionData {
    preferences?: {
      language: string;
      currency: string;
    };
  }
}

declare global {
  namespace Express {
    interface Request {
      user: {
        _id: Types.ObjectId;
        email: string;
        role: string;  // Add any other user properties you need here
      };
      userId: Types.ObjectId;
      preferences: {
        language?: string;
        currency?: string;
      };
    }
  }
}