import mongoose from "mongoose";
import dotenv from "dotenv";
import axios from "axios";
import cloudinary from "cloudinary";
import Product from "../models/product.model";
import CategoryModel, { ICategory } from "../models/category.model";
import Vendor from "../models/vendor.model";
import Country from "../models/country.model";
import { LoggerService } from "../services/logger.service";
import redisService from "../services/redis.service";
import { SubscriptionService } from "../services/subscription.service";

dotenv.config();

const logger = LoggerService.getInstance();
const MONGO_URI = process.env.MONGODB_URI!;

// Cloudinary config
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

async function fetchProductImages(
  productName: string,
  brand: string
): Promise<string[]> {
  try {
    const keyword = `${brand} ${productName}`.split(" ").slice(0, 3).join(" ");
    const res = await axios.get("https://api.unsplash.com/search/photos", {
      params: {
        query: keyword,
        per_page: 3,
      },
      headers: {
        Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
      },
    });

    const images = res.data.results?.slice(0, 3) || [];
    const imageUrls: string[] = [];

    for (let i = 0; i < images.length; i++) {
      const imageUrl = images[i]?.urls?.regular;
      if (imageUrl) {
        const uploadResult = await cloudinary.v2.uploader.upload(imageUrl, {
          folder: `products`,
          public_id: `${productName.replace(/\s+/g, "-").toLowerCase()}-${
            i + 1
          }`,
          overwrite: true,
          resource_type: "image",
        });
        imageUrls.push(uploadResult.secure_url);
      }
    }

    return imageUrls.length > 0
      ? imageUrls
      : [
          "https://via.placeholder.com/400x400?text=Product+Image",
          "https://via.placeholder.com/400x400?text=Product+Image+2",
        ];
  } catch (error) {
    console.warn(`⚠️ Error fetching images for ${productName}:`, error);
    return [
      "https://via.placeholder.com/400x400?text=Product+Image",
      "https://via.placeholder.com/400x400?text=Product+Image+2",
    ];
  }
}

// Sample product data templates with all required category attributes
const productTemplates = {
  electronics: [
    {
      name: "iPhone 15 Pro Max",
      brand: "Apple",
      description:
        "Latest iPhone with advanced camera system and titanium design. Features A17 Pro chip, 48MP camera, and all-day battery life.",
      condition: "new",
      basePrice: 1199,
      weight: 0.221,
      images: [],
      specs: [
        // Electronics base required attributes
        { key: "Brand", value: "Apple" },
        { key: "Warranty Period", value: "1 Year" },
        // Cell Phones & Accessories required attributes
        { key: "Model", value: "iPhone 15 Pro Max" },
        { key: "Network", value: "5G" },
        { key: "Storage Capacity", value: "256" },
        // Smartphones required attributes
        { key: "Operating System", value: "iOS" },
        { key: "Screen Size", value: "6.7" },
        { key: "Camera Resolution", value: "48MP" },
        { key: "5G Compatible", value: "true" },
        // iPhones required attributes
        { key: "Storage", value: "256GB" },
        { key: "Color", value: "Natural Titanium" },
      ],
    },
    {
      name: "Gaming Laptop",
      brand: "ASUS",
      description:
        "High-performance gaming laptop with RTX graphics and RGB keyboard.",
      condition: "new",
      basePrice: 1599,
      weight: 2.5,
      images: [],
      specs: [
        { key: "Brand", value: "ASUS" },
        { key: "Warranty Period", value: "2 Years" },
        { key: "Processor Type", value: "Intel i7" },
        { key: "RAM", value: "16" },
        { key: "Storage", value: "1TB" },
        { key: "Operating System", value: "Windows 11" },
        { key: "Screen Size", value: "15.6" },
        { key: "Graphics Card", value: "RTX 4060" },
      ],
    },
    {
      name: "Wireless Earbuds",
      brand: "Sony",
      description:
        "Premium wireless earbuds with noise cancellation and long battery life.",
      condition: "new",
      basePrice: 199,
      weight: 0.1,
      images: [],
      specs: [
        { key: "Brand", value: "Sony" },
        { key: "Warranty Period", value: "1 Year" },
        { key: "Battery Life", value: "8 hours" },
        { key: "Noise Cancellation", value: "true" },
        { key: "Water Resistance", value: "IPX4" },
      ],
    },
    {
      name: "Samsung Galaxy S24 Ultra",
      brand: "Samsung",
      description:
        "Premium Android smartphone with S Pen, 200MP camera, and AI features. Built for productivity and creativity.",
      condition: "new",
      basePrice: 1299,
      weight: 0.232,
      images: [],
      specs: [
        // Electronics base required attributes
        { key: "Brand", value: "Samsung" },
        { key: "Warranty Period", value: "1 Year" },
        // Cell Phones & Accessories required attributes
        { key: "Model", value: "Galaxy S24 Ultra" },
        { key: "Network", value: "5G" },
        { key: "Storage Capacity", value: "512" },
        // Smartphones required attributes
        { key: "Operating System", value: "Android" },
        { key: "Screen Size", value: "6.8" },
        { key: "Camera Resolution", value: "200MP" },
        { key: "5G Compatible", value: "true" },
        // Android Phones required attributes
        { key: "RAM", value: "12" },
        // Samsung Phones required attributes
        { key: "Series", value: "Galaxy S" },
        { key: "Model Number", value: "SM-S928U" },
        { key: "Screen Technology", value: "Dynamic AMOLED 2X" },
      ],
    },
    {
      name: "MacBook Pro 16-inch",
      brand: "Apple",
      description:
        "Professional laptop with M3 Pro chip, stunning Liquid Retina XDR display, and up to 22 hours of battery life.",
      condition: "new",
      basePrice: 2499,
      weight: 2.16,
      images: [],
      specs: [
        // Electronics base required attributes
        { key: "Brand", value: "Apple" },
        { key: "Warranty Period", value: "1 Year" },
        // Computers & Tablets required attributes
        { key: "Processor Type", value: "Apple M3 Pro" },
        { key: "RAM", value: "18" },
        { key: "Storage", value: "512" },
        { key: "Operating System", value: "macOS" },
        // Laptops & Netbooks required attributes
        { key: "Screen Size", value: "16" },
        { key: "Processor", value: "M3 Pro" },
        { key: "Graphics Card", value: "Integrated" },
        { key: "Battery Life", value: "22 hours" },
      ],
    },
  ],
  clothing: [
    {
      name: "Classic Denim Jacket",
      brand: "Levi's",
      description:
        "Timeless denim jacket made from premium cotton. Perfect for layering and casual wear.",
      condition: "new",
      basePrice: 89,
      weight: 0.8,
      images: [],
      specs: [
        // Clothing base required attributes
        { key: "Material", value: "100% Cotton Denim" },
        { key: "Care Instructions", value: "Machine wash cold" },
        { key: "Season", value: "All Season" },
        // Men's Clothing required attributes
        { key: "Size", value: "L" },
        { key: "Fit", value: "Regular" },
        // Outerwear required attributes
        { key: "Weather Resistance", value: "None" },
      ],
    },
    {
      name: "Running Sneakers",
      brand: "Nike",
      description:
        "Lightweight running shoes with responsive cushioning and breathable mesh upper.",
      condition: "new",
      basePrice: 129,
      weight: 0.6,
      images: [],
      specs: [
        // Clothing base required attributes
        { key: "Material", value: "Mesh and Synthetic" },
        { key: "Care Instructions", value: "Wipe clean" },
        // Shoes required attributes
        { key: "Size", value: "10" },
        { key: "Style", value: "Athletic" },
      ],
    },
    {
      name: "Casual T-Shirt",
      brand: "Uniqlo",
      description: "Comfortable cotton t-shirt perfect for everyday wear.",
      condition: "new",
      basePrice: 19,
      weight: 0.2,
      images: [],
      specs: [
        { key: "Material", value: "100% Cotton" },
        { key: "Care Instructions", value: "Machine wash" },
        { key: "Season", value: "All Season" },
        { key: "Size", value: "M" },
        { key: "Fit", value: "Regular" },
      ],
    },
    {
      name: "Winter Coat",
      brand: "North Face",
      description:
        "Warm winter coat with down insulation and waterproof exterior.",
      condition: "new",
      basePrice: 299,
      weight: 1.5,
      images: [],
      specs: [
        { key: "Material", value: "Nylon with Down Fill" },
        { key: "Care Instructions", value: "Dry clean only" },
        { key: "Season", value: "Winter" },
        { key: "Size", value: "L" },
        { key: "Fit", value: "Regular" },
        { key: "Weather Resistance", value: "Waterproof" },
      ],
    },
  ],
  homeGarden: [
    {
      name: "Ergonomic Office Chair",
      brand: "Herman Miller",
      description:
        "Premium office chair with lumbar support, adjustable height, and breathable mesh back.",
      condition: "new",
      basePrice: 395,
      weight: 18.5,
      images: [],
      specs: [
        // Home & Garden base required attributes
        { key: "Material", value: "Mesh and Aluminum" },
        { key: "Dimensions", value: "27 x 27 x 40-43 inches" },
        { key: "Weight", value: "18.5" },
        // Furniture required attributes
        { key: "Style", value: "Modern" },
        { key: "Assembly Required", value: "true" },
        // Office Furniture required attributes
        { key: "Type", value: "Chair" },
        { key: "Adjustable Height", value: "true" },
      ],
    },
    {
      name: "Stainless Steel Cookware Set",
      brand: "All-Clad",
      description:
        "Professional-grade cookware set with tri-ply construction for even heat distribution.",
      condition: "new",
      basePrice: 299,
      weight: 8.2,
      images: [],
      specs: [
        // Home & Garden base required attributes
        { key: "Material", value: "Stainless Steel" },
        { key: "Dimensions", value: "Various sizes" },
        { key: "Weight", value: "8.2" },
        // Kitchen & Dining required attributes
        { key: "Dishwasher Safe", value: "true" },
        { key: "Set Size", value: "10" },
        // Cookware required attributes
        { key: "Induction Compatible", value: "true" },
      ],
    },
  ],
  automotive: [
    {
      name: "LED Headlight Bulbs",
      brand: "Philips",
      description:
        "High-performance LED headlight bulbs with 6000K white light and long lifespan.",
      condition: "new",
      basePrice: 79,
      weight: 0.3,
      images: [],
      specs: [
        // Automotive base required attributes
        { key: "Make", value: "Universal" },
        { key: "Model", value: "H11" },
        { key: "Year", value: "2024" },
        { key: "Compatibility", value: "Universal fit" },
        // Car & Truck Parts required attributes
        { key: "Compatible Make", value: "Universal" },
        { key: "Compatible Model", value: "H11" },
        { key: "Compatible Year", value: "2010-2024" },
        { key: "Part Type", value: "Headlight Bulb" },
      ],
    },
  ],
  collectibles: [
    {
      name: "Vintage Baseball Card Collection",
      brand: "Topps",
      description:
        "Rare collection of 1980s baseball cards including rookie cards and hall of famers.",
      condition: "used",
      basePrice: 450,
      weight: 0.5,
      images: [],
      specs: [
        // Collectibles & Art base required attributes
        { key: "Era/Year", value: "1980-1989" },
        { key: "Condition", value: "Excellent" },
        { key: "Authenticity", value: "true" },
        { key: "Rarity", value: "Rare" },
      ],
    },
  ],
};

// Function to get category-specific specifications
function getCategorySpecifications(category: any, template: any) {
  const baseSpecs = [...template.specs];

  // Add category-specific required attributes
  if (category.attributes) {
    for (const attr of category.attributes) {
      if (attr.required && !baseSpecs.find((spec) => spec.key === attr.name)) {
        // Add default values for missing required attributes
        let defaultValue = "";
        switch (attr.name) {
          case "Brand":
            defaultValue = template.brand;
            break;
          case "Dimensions":
            defaultValue = "10 x 8 x 6 inches";
            break;
          case "Weight":
            defaultValue = template.weight.toString();
            break;
          case "Material":
            defaultValue = "Mixed Materials";
            break;
          default:
            if (attr.type === "boolean") {
              defaultValue = "false";
            } else if (attr.type === "number") {
              defaultValue = "1";
            } else if (attr.options && attr.options.length > 0) {
              defaultValue = attr.options[0];
            } else {
              defaultValue = "Not specified";
            }
        }

        baseSpecs.push({
          key: attr.name,
          value: defaultValue,
        });
      }
    }
  }

  return baseSpecs;
}

async function seedProducts() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    const keys = await redisService.redisClient.keys("*");
    if (keys.length > 0) {
      await redisService.redisClient.del(...keys);
    }

    // Get all vendors, categories, and countries
    const vendors = await Vendor.find();
    const categories = await CategoryModel.find();
    const countries = await Country.find();

    if (!vendors.length || !categories.length || !countries.length) {
      throw new Error("Please seed vendors, categories, and countries first");
    }

    console.log(
      `Found ${vendors.length} vendors, ${categories.length} categories, ${countries.length} countries`
    );

    // Clear existing products
    await Product.deleteMany({});
    console.log("Cleared existing products");

    let productCount = 0;
    const targetProducts = 500;

    // Create products for each vendor
    const usedProductNames = new Set<string>(); // Track used names to prevent duplicates

    for (const vendor of vendors) {
      if (productCount >= targetProducts) break;

      const vendorCountry = countries.find(
        (c) => c.name === vendor.businessInfo?.address?.country
      );
      if (!vendorCountry) continue;

      // Each vendor gets 8-12 products for more variety
      const productsPerVendor = Math.floor(Math.random() * 5) + 8;
      const vendorUsedNames = new Set<string>(); // Track names per vendor

      for (
        let i = 0;
        i < productsPerVendor && productCount < targetProducts;
        i++
      ) {
        try {
          // Randomly select a category and template
          const categoryType =
            Object.keys(productTemplates)[
              Math.floor(Math.random() * Object.keys(productTemplates).length)
            ];
          const templates =
            productTemplates[categoryType as keyof typeof productTemplates];
          const template =
            templates[Math.floor(Math.random() * templates.length)];

          // Prioritize subcategories (level 2+) for better product distribution
          const subcategories = categories.filter(cat => cat.level >= 2);
          const deepestCategories = categories.filter(cat => cat.level >= 3);
          
          let category: any = null;
          let subCategories: any[] = [];
          
          // First try to use deepest categories (level 3+)
          if (deepestCategories.length > 0 && Math.random() > 0.3) {
            category = deepestCategories[Math.floor(Math.random() * deepestCategories.length)];
          }
          // Then try level 2 categories
          else if (subcategories.length > 0 && Math.random() > 0.5) {
            category = subcategories[Math.floor(Math.random() * subcategories.length)];
          }
          // Fallback to main categories
          else {
            const mainCategories = categories.filter(c => c.level === 1);
            category = mainCategories[Math.floor(Math.random() * mainCategories.length)];
          }
          
          // Build subcategory chain if using a deep category
          if (category && category.level > 2) {
            // Find parent categories to build the chain
            let currentCat = category;
            const categoryChain = [];
            
            while (currentCat.parent) {
              const parentCat = categories.find(c => c._id.toString() === currentCat.parent.toString());
              if (parentCat && parentCat.level > 1) {
                categoryChain.unshift(parentCat._id);
              }
              currentCat = parentCat;
              if (!parentCat) break;
            }
            
            subCategories = categoryChain;
          }

          // Create more dynamic product names with better variation
          const variations = [
            "Pro",
            "Plus",
            "Elite",
            "Premium",
            "Standard",
            "Deluxe",
            "Max",
            "Mini",
            "Ultra",
            "Lite",
          ];
          const colors = [
            "Black",
            "White",
            "Blue",
            "Red",
            "Silver",
            "Gold",
            "Rose Gold",
            "Space Gray",
            "Green",
            "Purple",
          ];
          const years = ["2023", "2024", "2025"];
          const sizes = ["Compact", "Regular", "XL", "Mini", "Large"];

          let productName = template.name;
          let attempts = 0;

          // Generate unique product name
          do {
            const rand = Math.random();
            if (rand > 0.8) {
              productName = `${template.name} ${
                variations[Math.floor(Math.random() * variations.length)]
              } ${years[Math.floor(Math.random() * years.length)]}`;
            } else if (rand > 0.6) {
              productName = `${template.name} ${
                colors[Math.floor(Math.random() * colors.length)]
              }`;
            } else if (rand > 0.4) {
              productName = `${
                sizes[Math.floor(Math.random() * sizes.length)]
              } ${template.name}`;
            } else if (rand > 0.2) {
              productName = `${template.name} ${
                variations[Math.floor(Math.random() * variations.length)]
              }`;
            } else {
              productName = `${template.brand} ${template.name
                .split(" ")
                .slice(-2)
                .join(" ")} ${Math.floor(Math.random() * 1000)}`;
            }
            attempts++;
          } while (
            (usedProductNames.has(productName) ||
              vendorUsedNames.has(productName)) &&
            attempts < 10
          );

          // Skip if we can't generate a unique name
          if (
            usedProductNames.has(productName) ||
            vendorUsedNames.has(productName)
          ) {
            console.log(`⚠️ Skipping duplicate product: ${productName}`);
            continue;
          }

          usedProductNames.add(productName);
          vendorUsedNames.add(productName);

          // Generate product images (limit API calls due to 50/hour limit)
          let productImages: string[];
          if (productCount < 50) {
            // Only use real images for first 30 products
            console.log(`🖼️ Generating real images for ${productName}...`);
            productImages = await fetchProductImages(
              productName,
              template.brand
            );
          } else {
            // Use category-based placeholder images for remaining products
            const placeholderCategory = categoryType.toLowerCase();
            productImages = [
              `https://via.placeholder.com/400x400/4A90E2/FFFFFF?text=${encodeURIComponent(
                template.brand
              )}`,
              `https://via.placeholder.com/400x300/7ED321/FFFFFF?text=${encodeURIComponent(
                productName.split(" ").slice(0, 2).join(" ")
              )}`,
              `https://via.placeholder.com/500x400/F5A623/FFFFFF?text=${encodeURIComponent(
                placeholderCategory
              )}`,
            ];
          }

          // More dynamic price variation
          const priceVariation = 0.6 + Math.random() * 0.8; // 60% to 140% of base price
          const salePrice = Math.round(template.basePrice * priceVariation);
          const originalPrice = Math.round(
            salePrice * (1.05 + Math.random() * 0.4)
          ); // 5-45% higher

          // More varied quantity distribution
          const quantity =
            Math.random() > 0.8
              ? Math.floor(Math.random() * 100) + 50 // High stock items
              : Math.random() > 0.6
              ? Math.floor(Math.random() * 20) + 10 // Medium stock
              : Math.floor(Math.random() * 5) + 1; // Low stock items

          // Get category-specific specifications
          const specifications = getCategorySpecifications(category, template);

          // Check subscription plan limits
          const currentProductCount = vendor.analytics?.productCount || 0;
          const canAddProduct = await SubscriptionService.checkPlanLimits(
            vendor._id.toString(),
            'add_product',
            currentProductCount
          );

          if (!canAddProduct) {
            console.log(`⚠️ Product limit reached for vendor ${vendor.businessInfo?.name}`);
            continue;
          }

          // Check if product is being featured
          const isFeatured = Math.random() > 0.8;
          if (isFeatured) {
            const currentFeaturedCount = vendor.analytics?.featuredProducts || 0;
            const canFeatureProduct = await SubscriptionService.checkPlanLimits(
              vendor._id.toString(),
              'feature_product',
              currentFeaturedCount
            );

            if (!canFeatureProduct) {
              console.log(`⚠️ Featured product limit reached for vendor ${vendor.businessInfo?.name}`);
            }
          }

          const product = await Product.create({
            vendorId: vendor._id,
            name: productName,
            brand: template.brand,
            description: template.description,
            condition: template.condition,
            conditionDescription:
              template.condition === "used"
                ? "Gently used, excellent working condition"
                : undefined,
            category: {
              main: category.level === 1 ? category._id : (() => {
                const mainCat = categories.find(c => c.name === category.path[0] && c.level === 1);
                return mainCat ? mainCat._id : category._id;
              })(),
              sub: category.level > 1 ? [category._id, ...subCategories] : subCategories,
              path: category.path || [category.name],
            },
            country: vendorCountry._id,
            featured: isFeatured,
            inventory: {
              lowStockAlert: Math.floor(Math.random() * 5) + 2,
              listing:
                Math.random() > 0.8
                  ? {
                      type: "auction",
                      auction: {
                        startBidPrice: Math.round(salePrice * 0.7),
                        reservePrice: Math.round(salePrice * 0.9),
                        buyNowPrice: salePrice,
                        startTime: new Date(),
                        endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                        quantity: 1,
                        bidIncrement: Math.round(salePrice * 0.05),
                        isStarted: false,
                        isExpired: false,
                      },
                    }
                  : {
                      type: "instant",
                      instant: {
                        acceptOffer: Math.random() > 0.6,
                      },
                    },
            },
            images: productImages,
            specifications,
            shipping: {
              weight: template.weight,
              unit: "kg",
              dimensions: {
                length: Math.round((Math.random() * 30 + 10) * 100) / 100,
                width: Math.round((Math.random() * 20 + 5) * 100) / 100,
                height: Math.round((Math.random() * 15 + 3) * 100) / 100,
              },
              restrictions: ["none"],
            },
            status:
              Math.random() > 0.95
                ? "inactive"
                : quantity > 0
                ? "active"
                : "outOfStock",
            reviews: [],
            rating: 0,
            variants: (() => {
              const variantType = Math.random();
              if (variantType > 0.6) {
                // Size & Color variants
                const sizeColorOptions = [
                  { size: "Small", color: "Black", priceAdj: -10 },
                  { size: "Medium", color: "White", priceAdj: 0 },
                  { size: "Large", color: "Blue", priceAdj: 10 },
                  { size: "XL", color: "Red", priceAdj: 15 }
                ];
                return [{
                  name: "Size & Color",
                  isDefault: true,
                  options: sizeColorOptions.map((opt, idx) => ({
                    value: `${opt.size} ${opt.color}`,
                    sku: `${productName.replace(/\s+/g, "-").toUpperCase()}-${opt.size.substring(0,2).toUpperCase()}-${opt.color.substring(0,3).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
                    price: salePrice + opt.priceAdj,
                    salePrice: idx === 0 && Math.random() > 0.5 ? salePrice + opt.priceAdj - 5 : undefined,
                    quantity: Math.floor(Math.random() * 25) + 5,
                    isDefault: idx === 0,
                    dimensions: { "Size": opt.size, "Color": opt.color }
                  }))
                }];
              } else if (variantType > 0.3) {
                // Storage & Color variants (for electronics)
                const storageColorOptions = [
                  { storage: "128GB", color: "Space Gray", priceAdj: 0 },
                  { storage: "256GB", color: "Silver", priceAdj: 100 },
                  { storage: "512GB", color: "Gold", priceAdj: 200 },
                  { storage: "1TB", color: "Rose Gold", priceAdj: 400 }
                ];
                return [{
                  name: "Storage & Color",
                  isDefault: true,
                  options: storageColorOptions.map((opt, idx) => ({
                    value: `${opt.storage} ${opt.color}`,
                    sku: `${productName.replace(/\s+/g, "-").toUpperCase()}-${opt.storage.replace('GB','').replace('TB','T')}-${opt.color.replace(' ','').substring(0,4).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
                    price: salePrice + opt.priceAdj,
                    quantity: Math.floor(Math.random() * 15) + 3,
                    isDefault: idx === 0,
                    dimensions: { "Storage": opt.storage, "Color": opt.color }
                  }))
                }];
              } else {
                // Material & Size variants
                const materialSizeOptions = [
                  { material: "Cotton", size: "S", priceAdj: -5 },
                  { material: "Cotton", size: "M", priceAdj: 0 },
                  { material: "Cotton", size: "L", priceAdj: 5 },
                  { material: "Premium Cotton", size: "M", priceAdj: 20 },
                  { material: "Premium Cotton", size: "L", priceAdj: 25 }
                ];
                return [{
                  name: "Material & Size",
                  isDefault: true,
                  options: materialSizeOptions.map((opt, idx) => ({
                    value: `${opt.material} ${opt.size}`,
                    sku: `${productName.replace(/\s+/g, "-").toUpperCase()}-${opt.material.replace(' ','').substring(0,4).toUpperCase()}-${opt.size}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
                    price: salePrice + opt.priceAdj,
                    quantity: Math.floor(Math.random() * 20) + 2,
                    isDefault: idx === 1,
                    dimensions: { "Material": opt.material, "Size": opt.size }
                  }))
                }];
              }
            })(),
            variantDimensions: (() => {
              const variantType = Math.random();
              if (variantType > 0.6) return ["Size", "Color"];
              else if (variantType > 0.3) return ["Storage", "Color"];
              else return ["Material", "Size"];
            })(),
            analytics: {
              views: Math.floor(Math.random() * 1000),
              addToCart: Math.floor(Math.random() * 50),
              wishlist: Math.floor(Math.random() * 30),
              purchases: Math.floor(Math.random() * 20),
              conversionRate: Math.round((Math.random() * 5 + 1) * 100) / 100,
            },
            offers: [],
            bids: [],
          });

          // Update vendor analytics - increment product count
          await Vendor.findByIdAndUpdate(vendor._id, {
            $inc: { 
              'analytics.productCount': 1,
              ...(isFeatured ? { 'analytics.featuredProducts': 1 } : {})
            }
          });

          productCount++;
          if (productCount % 20 === 0) {
            console.log(`Created ${productCount} products...`);
          }
        } catch (error) {
          if (error instanceof Error) {
            console.error(
              `Error creating product for vendor ${vendor.businessInfo?.name}:`,
              error.message
            );
          } else {
            console.error(
              `Error creating product for vendor ${vendor.businessInfo?.name}:`,
              error
            );
          }
        }
      }
    }

    console.log(`✅ Successfully seeded ${productCount} products`);
    process.exit(0);
  } catch (error) {
    console.error("Error seeding products:", error);
    process.exit(1);
  }
}

seedProducts();
