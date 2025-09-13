import axios from "axios";
import { Request, Response, NextFunction } from "express";
import getCountryPreferences from "../utils/get-country-preferences";

export const getCountryFromIP = async (ip: string) => {
  try {
    const response = await axios.get(`http://ip-api.com/json/${ip}`);
    console.log(response.data)
    return response.data.country; // Returns country name (e.g., "Nigeria")
  } catch (error) {
    console.error("Error fetching country from IP:", error);
    return null;
  }
};


export const setPreferencesMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  console.log(req.preferences)
  // Only set preferences if they haven't been set already
  if (!req.session.preferences) {
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const countryName = await getCountryFromIP(ip as string);
  
     const preferences = getCountryPreferences(countryName); // Looks up using full name

    req.session.preferences = preferences;
  }
  req.preferences = req.session.preferences;

  next();
};