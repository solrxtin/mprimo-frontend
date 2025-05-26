import axios from "axios";
import { Request, Response, NextFunction } from "express";

export const getCountryFromIP = async (ip: string) => {
  try {
    const response = await axios.get(`http://ip-api.com/json/${ip}`);
    console.log(response.data)
    return response.data.countryCode; // Returns country code (e.g., "US", "NG", "FR")
  } catch (error) {
    console.error("Error fetching country from IP:", error);
    return null;
  }
};

export const countryPreferences: Record<string, { language: string; currency: string }> = {
  US: { language: "en", currency: "USD" },
  NG: { language: "en", currency: "NGN" },
  GB: { language: "en", currency: "GBP" },
  FR: { language: "fr", currency: "EUR" },
  DE: { language: "de", currency: "EUR" },
  IN: { language: "hi", currency: "INR" },
};

export const setPreferencesMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  console.log(req.preferences)
  // Only set preferences if they haven't been set already
  if (!req.session.preferences) {
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const countryCode = await getCountryFromIP(ip as string);
  
    req.session.preferences =
      countryPreferences[countryCode] || { language: "en", currency: "USD" };
  }
  req.preferences = req.session.preferences;

  next();
};