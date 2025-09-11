import { Request, Response } from "express";
import Banner from "../models/banner.model";

export const trackBannerClick = async (req: Request, res: Response) => {
  try {
    const { bannerId } = req.params;
    
    const banner = await Banner.findByIdAndUpdate(
      bannerId,
      { $inc: { clickCount: 1 } },
      { new: true }
    );

    if (!banner) {
      return res.status(404).json({ success: false, message: "Banner not found" });
    }

    // Redirect to target URL
    if (banner.targetUrl) {
      return res.redirect(banner.targetUrl);
    }

    res.json({ success: true, message: "Click tracked" });
  } catch (error) {
    console.error("Track banner click error:", error);
    res.status(500).json({ success: false, message: "Error tracking click" });
  }
};

export const trackBannerImpression = async (req: Request, res: Response) => {
  try {
    const { bannerId } = req.params;
    
    await Banner.findByIdAndUpdate(
      bannerId,
      { $inc: { impressions: 1 } }
    );

    res.json({ success: true, message: "Impression tracked" });
  } catch (error) {
    console.error("Track banner impression error:", error);
    res.status(500).json({ success: false, message: "Error tracking impression" });
  }
};

export const getBannerStats = async (req: Request, res: Response) => {
  try {
    const { bannerId } = req.params;
    
    const banner = await Banner.findById(bannerId).select("title clickCount impressions");
    if (!banner) {
      return res.status(404).json({ success: false, message: "Banner not found" });
    }

    const clickThroughRate = banner.impressions > 0 
      ? ((banner.clickCount / banner.impressions) * 100).toFixed(2)
      : "0.00";

    res.json({
      success: true,
      data: {
        title: banner.title,
        clicks: banner.clickCount,
        impressions: banner.impressions,
        clickThroughRate: `${clickThroughRate}%`
      }
    });
  } catch (error) {
    console.error("Get banner stats error:", error);
    res.status(500).json({ success: false, message: "Error fetching banner stats" });
  }
};