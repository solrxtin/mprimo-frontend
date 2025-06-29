import mongoose from "mongoose";
import dotenv from "dotenv";
import axios from "axios";
import Category, { ICategory } from "../models/category.model"; // assuming a Category model
import cloudinary from "cloudinary";

dotenv.config();

// Cloudinary config
cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!,
  });

async function fetchImageUrl(keyword: string): Promise<string | null> {
  // Use a free image API (Pixabay, Unsplash) or your own asset server
  const res = await axios.get("https://api.unsplash.com/search/photos", {
    params: {
      query: keyword,
      per_page: 1,
    },
    headers: {
      Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`
    },
  });
  return res.data.results?.[0]?.urls?.regular || null;
}

async function uploadImageToCloudinary(imageUrl: string, categoryId: string) {
  return await cloudinary.v2.uploader.upload(imageUrl, {
    folder: `categories/${categoryId}`,
    public_id: `image`,
    overwrite: true,
    resource_type: "image",
  });
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log("✅ Connected to MongoDB");

  const categories: ICategory[] = await Category.find({ image: { $exists: false } });
  console.log(`🌐 Found ${categories.length} categories without images`);

  for (let i = 50; i < categories.length; i++) {
    const cat = categories[i];
    const keyword = cat.name.split(" ").slice(0, 2).join(" ");
    console.log(`🔍 Searching for image for category "${cat.name}" (keyword: ${keyword})`);
    
    const fetchedUrl = await fetchImageUrl(keyword);
    if (!fetchedUrl) {
      console.warn(`⚠️ No image found for ${cat.name}`);
      continue;
    }

    console.log(`👉 Uploading image to Cloudinary`);
    const uploadResult = await uploadImageToCloudinary(fetchedUrl, (cat._id as mongoose.Types.ObjectId).toString());

    cat.image = uploadResult.secure_url;
    cat.updatedBy = new mongoose.Types.ObjectId(process.env.ADMIN_USER_ID!);
    await cat.save();

    console.log(`✅ Uploaded & updated category "${cat.name}" with image ${uploadResult.secure_url}`);
  }

  console.log("🎯 Done processing categories.");
  process.exit(0);
}

main().catch(err => {
  console.error("❌ Script error:", err);
  process.exit(1);
});
