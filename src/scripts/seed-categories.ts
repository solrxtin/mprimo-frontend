// src/scripts/seed-categories.ts
import mongoose from "mongoose";
import dotenv from "dotenv";
import CategoryModel from "../models/category.model";

dotenv.config();

mongoose
  .connect(process.env.MONGODB_URI!)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

async function seedCategories() {
  try {
    // Clear existing categories
    await CategoryModel.deleteMany({});
    console.log("Cleared existing categories");

    const adminId = new mongoose.Types.ObjectId("68c94179472546523eca304c");
    
    // Create main categories (Level 1)
    const electronics = await CategoryModel.create({
      name: "Electronics",
      description: "Electronic devices and gadgets",
      attributes: [
        { name: "Brand", type: "text", required: true },
        { name: "Warranty Period", type: "text", required: false },
        { name: "Power Consumption", type: "number", required: false },
        { name: "Voltage", type: "number", required: false },
      ],
      productDimensionsRequired: true,
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Electronics"]
    });

    const clothing = await CategoryModel.create({
      name: "Clothing, Shoes & Accessories",
      description: "Apparel, footwear, and fashion accessories",
      attributes: [
        { name: "Material", type: "text", required: true },
        { name: "Care Instructions", type: "text", required: false },
        {
          name: "Season",
          type: "select",
          required: false,
          options: ["Summer", "Winter", "Spring", "Fall", "All Season"],
        },
      ],
      productDimensionsRequired: false,
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Clothing, Shoes & Accessories"]
    });

    const homeAndGarden = await CategoryModel.create({
      name: "Home & Garden",
      description: "Home goods, furniture, and garden supplies",
      attributes: [
        { name: "Material", type: "text", required: true },
        { name: "Dimensions", type: "text", required: true },
        { name: "Weight", type: "number", required: false },
        { name: "Care Instructions", type: "text", required: false },
      ],
      productDimensionsRequired: true,
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Home & Garden"]
    });

    const collectibles = await CategoryModel.create({
      name: "Collectibles & Art",
      description: "Collectible items and artwork",
      attributes: [
        { name: "Era/Year", type: "text", required: true },
        { name: "Condition", type: "text", required: true },
        { name: "Authenticity", type: "boolean", required: false },
        { name: "Rarity", type: "text", required: false },
      ],
      productDimensionsRequired: true,
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Collectibles & Art"]
    });
    
    // Level 2 Categories (Collectibles & Art)
    const fineArt = await CategoryModel.create({
      name: "Fine Art",
      description: "Paintings, sculptures, and other fine art",
      parent: collectibles._id,
      attributes: [
        { name: "Medium", type: "text", required: true },
        { name: "Artist", type: "text", required: true },
        { name: "Year Created", type: "number", required: true },
        { name: "Dimensions", type: "text", required: true },
        { name: "Authentication", type: "boolean", required: true },
      ],
      productDimensionsRequired: true,
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Collectibles & Art", "Fine Art"]
    });
    
    const antiquesCollectibles = await CategoryModel.create({
      name: "Antiques",
      description: "Vintage and antique collectible items",
      parent: collectibles._id,
      attributes: [
        { name: "Era", type: "text", required: true },
        { name: "Material", type: "text", required: true },
        { name: "Condition", type: "select", required: true, options: ["Mint", "Excellent", "Good", "Fair", "Poor"] },
        { name: "Provenance", type: "text", required: false },
      ],
      productDimensionsRequired: true,
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Collectibles & Art", "Antiques"]
    });
    
    const coins = await CategoryModel.create({
      name: "Coins & Paper Money",
      description: "Collectible currency and numismatic items",
      parent: collectibles._id,
      attributes: [
        { name: "Type", type: "select", required: true, options: ["Coin", "Banknote", "Token", "Medal"] },
        { name: "Country of Origin", type: "text", required: true },
        { name: "Year", type: "number", required: true },
        { name: "Denomination", type: "text", required: true },
        { name: "Grade", type: "text", required: false },
      ],
      productDimensionsRequired: false,
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Collectibles & Art", "Coins & Paper Money"]
    });
    
    const stamps = await CategoryModel.create({
      name: "Stamps",
      description: "Collectible postage stamps and philatelic items",
      parent: collectibles._id,
      attributes: [
        { name: "Country of Origin", type: "text", required: true },
        { name: "Year", type: "number", required: true },
        { name: "Denomination", type: "text", required: true },
        { name: "Condition", type: "select", required: true, options: ["Mint", "Used", "Hinged", "Never Hinged"] },
        { name: "Certification", type: "boolean", required: false },
      ],
      productDimensionsRequired: false,
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Collectibles & Art", "Stamps"]
    });
    
    // Level 3 Categories (Fine Art)
    const paintings = await CategoryModel.create({
      name: "Paintings",
      description: "Original paintings and artwork",
      parent: fineArt._id,
      attributes: [
        { name: "Medium", type: "select", required: true, options: ["Oil", "Acrylic", "Watercolor", "Mixed Media", "Other"] },
        { name: "Surface", type: "select", required: true, options: ["Canvas", "Paper", "Wood", "Metal", "Other"] },
        { name: "Style", type: "text", required: true },
        { name: "Dimensions", type: "text", required: true },
      ],
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Collectibles & Art", "Fine Art", "Paintings"]
    });
    
    const sculptures = await CategoryModel.create({
      name: "Sculptures & Carvings",
      description: "Three-dimensional artwork",
      parent: fineArt._id,
      attributes: [
        { name: "Medium", type: "select", required: true, options: ["Stone", "Metal", "Wood", "Clay", "Glass", "Mixed Media"] },
        { name: "Height", type: "number", required: true },
        { name: "Weight", type: "number", required: true },
        { name: "Style", type: "text", required: true },
      ],
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Collectibles & Art", "Fine Art", "Sculptures & Carvings"]
    });

    const automotive = await CategoryModel.create({
      name: "Automotive",
      description: "Vehicles, parts, and accessories",
      attributes: [
        { name: "Make", type: "text", required: true },
        { name: "Model", type: "text", required: true },
        { name: "Year", type: "number", required: true },
        { name: "Compatibility", type: "text", required: false },
      ],
      productDimensionsRequired: true,
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Automotive"]
    });
    
    // Level 2 Categories (Automotive)
    const carParts = await CategoryModel.create({
      name: "Car & Truck Parts",
      description: "Replacement parts and accessories for cars and trucks",
      parent: automotive._id,
      attributes: [
        { name: "Compatible Make", type: "text", required: true },
        { name: "Compatible Model", type: "text", required: true },
        { name: "Compatible Year", type: "text", required: true },
        { name: "Part Type", type: "text", required: true },
      ],
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Automotive", "Car & Truck Parts"]
    });
    
    const motorcycleParts = await CategoryModel.create({
      name: "Motorcycle Parts",
      description: "Parts and accessories for motorcycles",
      parent: automotive._id,
      attributes: [
        { name: "Compatible Make", type: "text", required: true },
        { name: "Compatible Model", type: "text", required: true },
        { name: "Compatible Year", type: "text", required: true },
        { name: "Part Type", type: "text", required: true },
      ],
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Automotive", "Motorcycle Parts"]
    });
    
    const autoTools = await CategoryModel.create({
      name: "Automotive Tools",
      description: "Tools for vehicle maintenance and repair",
      parent: automotive._id,
      attributes: [
        { name: "Tool Type", type: "text", required: true },
        { name: "Material", type: "text", required: true },
        { name: "Specialized For", type: "text", required: false },
      ],
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Automotive", "Automotive Tools"]
    });
    
    // Level 3 Categories (Car & Truck Parts)
    const engineParts = await CategoryModel.create({
      name: "Engine & Components",
      description: "Engine parts and related components",
      parent: carParts._id,
      attributes: [
        { name: "Component Type", type: "text", required: true },
        { name: "Compatible Engine", type: "text", required: true },
        { name: "OEM Part Number", type: "text", required: false },
      ],
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Automotive", "Car & Truck Parts", "Engine & Components"]
    });
    
    const exteriorParts = await CategoryModel.create({
      name: "Exterior Parts",
      description: "Body panels, trim, and exterior accessories",
      parent: carParts._id,
      attributes: [
        { name: "Part Type", type: "text", required: true },
        { name: "Material", type: "text", required: true },
        { name: "Color", type: "text", required: false },
      ],
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Automotive", "Car & Truck Parts", "Exterior Parts"]
    });
    
    const interiorParts = await CategoryModel.create({
      name: "Interior Parts",
      description: "Seats, trim, and interior accessories",
      parent: carParts._id,
      attributes: [
        { name: "Part Type", type: "text", required: true },
        { name: "Material", type: "text", required: true },
        { name: "Color", type: "text", required: false },
      ],
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Automotive", "Car & Truck Parts", "Interior Parts"]
    });
    
    // Level 4 Categories (Engine & Components)
    const engineBlocks = await CategoryModel.create({
      name: "Engine Blocks & Components",
      description: "Engine blocks, pistons, and internal components",
      parent: engineParts._id,
      attributes: [
        { name: "Component Type", type: "text", required: true },
        { name: "Material", type: "text", required: true },
        { name: "Fitment", type: "text", required: true },
      ],
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Automotive", "Car & Truck Parts", "Engine & Components", "Engine Blocks & Components"]
    });
    
    const fuelSystem = await CategoryModel.create({
      name: "Fuel System",
      description: "Fuel pumps, injectors, and related components",
      parent: engineParts._id,
      attributes: [
        { name: "Component Type", type: "text", required: true },
        { name: "Fuel Type", type: "select", required: true, options: ["Gasoline", "Diesel", "Flex Fuel", "CNG"] },
        { name: "Flow Rate", type: "text", required: false },
      ],
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Automotive", "Car & Truck Parts", "Engine & Components", "Fuel System"]
    });

    const toys = await CategoryModel.create({
      name: "Toys & Hobbies",
      description: "Toys, games, and hobby items",
      attributes: [
        { name: "Age Range", type: "text", required: true },
        { name: "Brand", type: "text", required: true },
        { name: "Material", type: "text", required: false },
      ],
      productDimensionsRequired: true,
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Toys & Hobbies"]
    });
    
    // Level 2 Categories (Toys & Hobbies)
    const actionFigures = await CategoryModel.create({
      name: "Action Figures & Accessories",
      description: "Collectible action figures and related accessories",
      parent: toys._id,
      attributes: [
        { name: "Character", type: "text", required: true },
        { name: "Franchise", type: "text", required: true },
        { name: "Size", type: "number", required: true },
        { name: "Articulation Points", type: "number", required: false },
      ],
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Toys & Hobbies", "Action Figures & Accessories"]
    });
    
    const buildingToys = await CategoryModel.create({
      name: "Building Toys",
      description: "Construction and building block toys",
      parent: toys._id,
      attributes: [
        { name: "Brand", type: "text", required: true },
        { name: "Piece Count", type: "number", required: true },
        { name: "Theme", type: "text", required: false },
        { name: "Age Range", type: "text", required: true },
      ],
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Toys & Hobbies", "Building Toys"]
    });
    
    const tradingCards = await CategoryModel.create({
      name: "Trading Cards & Accessories",
      description: "Collectible trading cards and related accessories",
      parent: toys._id,
      attributes: [
        { name: "Game/Series", type: "text", required: true },
        { name: "Card Type", type: "text", required: true },
        { name: "Condition", type: "select", required: true, options: ["Mint", "Near Mint", "Excellent", "Good", "Fair", "Poor"] },
        { name: "Rarity", type: "text", required: false },
      ],
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Toys & Hobbies", "Trading Cards & Accessories"]
    });
    
    const modelKits = await CategoryModel.create({
      name: "Models & Kits",
      description: "Scale models and model building kits",
      parent: toys._id,
      attributes: [
        { name: "Type", type: "text", required: true },
        { name: "Scale", type: "text", required: true },
        { name: "Skill Level", type: "select", required: true, options: ["Beginner", "Intermediate", "Advanced", "Expert"] },
        { name: "Material", type: "text", required: true },
      ],
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Toys & Hobbies", "Models & Kits"]
    });
    
    // Level 3 Categories (Trading Cards)
    const pokemonCards = await CategoryModel.create({
      name: "Pokémon Cards",
      description: "Pokémon Trading Card Game cards and accessories",
      parent: tradingCards._id,
      attributes: [
        { name: "Card Type", type: "select", required: true, options: ["Pokémon", "Trainer", "Energy"] },
        { name: "Rarity", type: "select", required: true, options: ["Common", "Uncommon", "Rare", "Holo Rare", "Ultra Rare", "Secret Rare"] },
        { name: "Set", type: "text", required: true },
        { name: "Condition", type: "select", required: true, options: ["Mint", "Near Mint", "Excellent", "Good", "Fair", "Poor"] },
      ],
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Toys & Hobbies", "Trading Cards & Accessories", "Pokémon Cards"]
    });
    
    const magicCards = await CategoryModel.create({
      name: "Magic: The Gathering Cards",
      description: "Magic: The Gathering cards and accessories",
      parent: tradingCards._id,
      attributes: [
        { name: "Card Type", type: "select", required: true, options: ["Creature", "Instant", "Sorcery", "Enchantment", "Artifact", "Planeswalker", "Land"] },
        { name: "Rarity", type: "select", required: true, options: ["Common", "Uncommon", "Rare", "Mythic Rare"] },
        { name: "Set", type: "text", required: true },
        { name: "Condition", type: "select", required: true, options: ["Mint", "Near Mint", "Excellent", "Good", "Fair", "Poor"] },
      ],
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Toys & Hobbies", "Trading Cards & Accessories", "Magic: The Gathering Cards"]
    });

    const sportingGoods = await CategoryModel.create({
      name: "Sporting Goods",
      description: "Sports equipment and outdoor gear",
      attributes: [
        { name: "Sport Type", type: "text", required: true },
        { name: "Brand", type: "text", required: true },
        { name: "Material", type: "text", required: false },
      ],
      productDimensionsRequired: true,
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Sporting Goods"]
    });

    const beautyAndHealth = await CategoryModel.create({
      name: "Health & Beauty",
      description: "Personal care, cosmetics, and wellness products",
      attributes: [
        { name: "Brand", type: "text", required: true },
        { name: "Product Type", type: "text", required: true },
        { name: "Volume or Weight", type: "number", required: true },
        { name: "Fragrance", type: "boolean", required: false },
        { name: "Expiry Date", type: "text", required: false },
        { name: "Ingredients", type: "text", required: false },
      ],
      productDimensionsRequired: false,
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Health & Beauty"]
    });
    
    // Level 2 Categories (Health & Beauty)
    const skincare = await CategoryModel.create({
      name: "Skincare",
      description: "Facial and body skincare products",
      parent: beautyAndHealth._id,
      attributes: [
        { name: "Skin Type", type: "select", required: true, options: ["Normal", "Dry", "Oily", "Combination", "Sensitive"] },
        { name: "Product Type", type: "text", required: true },
        { name: "Volume", type: "number", required: true },
        { name: "Main Ingredient", type: "text", required: false },
      ],
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Health & Beauty", "Skincare"]
    });
    
    const haircare = await CategoryModel.create({
      name: "Haircare",
      description: "Shampoo, conditioner, and hair styling products",
      parent: beautyAndHealth._id,
      attributes: [
        { name: "Hair Type", type: "select", required: true, options: ["Normal", "Dry", "Oily", "Damaged", "Curly", "Straight"] },
        { name: "Product Type", type: "text", required: true },
        { name: "Volume", type: "number", required: true },
      ],
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Health & Beauty", "Haircare"]
    });
    
    const makeup = await CategoryModel.create({
      name: "Makeup",
      description: "Cosmetics and makeup products",
      parent: beautyAndHealth._id,
      attributes: [
        { name: "Product Type", type: "text", required: true },
        { name: "Shade/Color", type: "text", required: false },
        { name: "Finish", type: "select", required: false, options: ["Matte", "Satin", "Dewy", "Glossy", "Metallic"] },
      ],
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Health & Beauty", "Makeup"]
    });
    
    const fragrance = await CategoryModel.create({
      name: "Fragrance",
      description: "Perfumes, colognes, and body sprays",
      parent: beautyAndHealth._id,
      attributes: [
        { name: "Gender", type: "select", required: true, options: ["Men", "Women", "Unisex"] },
        { name: "Concentration", type: "select", required: true, options: ["Eau de Parfum", "Eau de Toilette", "Eau de Cologne", "Body Spray"] },
        { name: "Volume", type: "number", required: true },
        { name: "Scent Family", type: "text", required: false },
      ],
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Health & Beauty", "Fragrance"]
    });
    
    // Level 3 Categories (Skincare)
    const facialCare = await CategoryModel.create({
      name: "Facial Care",
      description: "Products specifically for facial skincare",
      parent: skincare._id,
      attributes: [
        { name: "Product Type", type: "select", required: true, options: ["Cleanser", "Moisturizer", "Serum", "Mask", "Toner", "Exfoliator"] },
        { name: "Skin Concern", type: "select", required: false, options: ["Acne", "Aging", "Dryness", "Dullness", "Redness"] },
        { name: "Volume", type: "number", required: true },
      ],
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Health & Beauty", "Skincare", "Facial Care"]
    });
    
    const bodyCare = await CategoryModel.create({
      name: "Body Care",
      description: "Products for body skincare",
      parent: skincare._id,
      attributes: [
        { name: "Product Type", type: "select", required: true, options: ["Lotion", "Wash", "Scrub", "Oil", "Butter"] },
        { name: "Skin Concern", type: "select", required: false, options: ["Dryness", "Aging", "Cellulite", "Stretch Marks"] },
        { name: "Volume", type: "number", required: true },
      ],
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Health & Beauty", "Skincare", "Body Care"]
    });
    
    // Level 2 Categories (Home & Garden)
    const furniture = await CategoryModel.create({
      name: "Furniture",
      description: "Home and office furniture",
      parent: homeAndGarden._id,
      attributes: [
        { name: "Material", type: "text", required: true },
        { name: "Style", type: "text", required: true },
        { name: "Assembly Required", type: "boolean", required: true },
        { name: "Dimensions", type: "text", required: true },
      ],
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Home & Garden", "Furniture"]
    });
    
    const kitchenDining = await CategoryModel.create({
      name: "Kitchen & Dining",
      description: "Kitchen appliances, cookware, and dining items",
      parent: homeAndGarden._id,
      attributes: [
        { name: "Material", type: "text", required: true },
        { name: "Dishwasher Safe", type: "boolean", required: false },
        { name: "Set Size", type: "number", required: false },
      ],
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Home & Garden", "Kitchen & Dining"]
    });
    
    const bedBath = await CategoryModel.create({
      name: "Bed & Bath",
      description: "Bedding, bathroom items, and related accessories",
      parent: homeAndGarden._id,
      attributes: [
        { name: "Material", type: "text", required: true },
        { name: "Size", type: "select", required: true, options: ["Twin", "Full", "Queen", "King", "California King"] },
        { name: "Thread Count", type: "number", required: false },
      ],
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Home & Garden", "Bed & Bath"]
    });
    
    const garden = await CategoryModel.create({
      name: "Garden & Outdoor",
      description: "Garden tools, outdoor furniture, and landscaping supplies",
      parent: homeAndGarden._id,
      attributes: [
        { name: "Material", type: "text", required: true },
        { name: "Weather Resistant", type: "boolean", required: true },
        { name: "Dimensions", type: "text", required: false },
      ],
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Home & Garden", "Garden & Outdoor"]
    });
    
    // Level 3 Categories (Furniture)
    const livingRoomFurniture = await CategoryModel.create({
      name: "Living Room Furniture",
      description: "Sofas, chairs, tables, and other living room items",
      parent: furniture._id,
      attributes: [
        { name: "Type", type: "select", required: true, options: ["Sofa", "Chair", "Table", "Entertainment Center", "Bookshelf"] },
        { name: "Material", type: "text", required: true },
        { name: "Color", type: "text", required: true },
      ],
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Home & Garden", "Furniture", "Living Room Furniture"]
    });
    
    const bedroomFurniture = await CategoryModel.create({
      name: "Bedroom Furniture",
      description: "Beds, dressers, nightstands, and other bedroom items",
      parent: furniture._id,
      attributes: [
        { name: "Type", type: "select", required: true, options: ["Bed Frame", "Mattress", "Dresser", "Nightstand", "Wardrobe"] },
        { name: "Material", type: "text", required: true },
        { name: "Bed Size", type: "select", required: false, options: ["Twin", "Full", "Queen", "King", "California King"] },
      ],
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Home & Garden", "Furniture", "Bedroom Furniture"]
    });
    
    const officeFurniture = await CategoryModel.create({
      name: "Office Furniture",
      description: "Desks, office chairs, and other workspace items",
      parent: furniture._id,
      attributes: [
        { name: "Type", type: "select", required: true, options: ["Desk", "Chair", "Bookcase", "Filing Cabinet", "Workstation"] },
        { name: "Material", type: "text", required: true },
        { name: "Adjustable Height", type: "boolean", required: false },
      ],
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Home & Garden", "Furniture", "Office Furniture"]
    });
    
    // Level 3 Categories (Kitchen & Dining)
    const cookware = await CategoryModel.create({
      name: "Cookware",
      description: "Pots, pans, and cooking utensils",
      parent: kitchenDining._id,
      attributes: [
        { name: "Material", type: "select", required: true, options: ["Stainless Steel", "Cast Iron", "Non-stick", "Ceramic", "Copper"] },
        { name: "Dishwasher Safe", type: "boolean", required: true },
        { name: "Induction Compatible", type: "boolean", required: false },
      ],
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Home & Garden", "Kitchen & Dining", "Cookware"]
    });
    
    const smallAppliances = await CategoryModel.create({
      name: "Small Appliances",
      description: "Blenders, toasters, coffee makers, and other small kitchen appliances",
      parent: kitchenDining._id,
      attributes: [
        { name: "Appliance Type", type: "text", required: true },
        { name: "Wattage", type: "number", required: true },
        { name: "Capacity", type: "text", required: false },
      ],
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Home & Garden", "Kitchen & Dining", "Small Appliances"]
    });
    
    // Level 3 Categories (Garden & Outdoor)
    const gardenTools = await CategoryModel.create({
      name: "Garden Tools & Equipment",
      description: "Tools and equipment for gardening and landscaping",
      parent: garden._id,
      attributes: [
        { name: "Tool Type", type: "text", required: true },
        { name: "Power Source", type: "select", required: true, options: ["Manual", "Electric", "Gas", "Battery"] },
        { name: "Material", type: "text", required: true },
      ],
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Home & Garden", "Garden & Outdoor", "Garden Tools & Equipment"]
    });
    
    const outdoorFurniture = await CategoryModel.create({
      name: "Outdoor Furniture",
      description: "Patio furniture and outdoor seating",
      parent: garden._id,
      attributes: [
        { name: "Material", type: "select", required: true, options: ["Wood", "Metal", "Wicker", "Plastic", "Resin"] },
        { name: "Weather Resistant", type: "boolean", required: true },
        { name: "Set Pieces", type: "number", required: false },
      ],
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Home & Garden", "Garden & Outdoor", "Outdoor Furniture"]
    });

    // Level 2 Categories (Electronics)
    const computers = await CategoryModel.create({
      name: "Computers & Tablets",
      description: "Desktop computers, laptops, and tablets",
      parent: electronics._id,
      attributes: [
        { name: "Processor Type", type: "text", required: true },
        { name: "RAM", type: "number", required: true },
        { name: "Storage", type: "number", required: true },
        { name: "Operating System", type: "text", required: true },
      ],
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Electronics", "Computers & Tablets"]
    });

    const cellPhones = await CategoryModel.create({
      name: "Cell Phones & Accessories",
      description: "Mobile phones and related accessories",
      parent: electronics._id,
      attributes: [
        { name: "Brand", type: "text", required: true },
        { name: "Model", type: "text", required: true },
        { name: "Network", type: "text", required: false },
        { name: "Storage Capacity", type: "number", required: true },
      ],
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Electronics", "Cell Phones & Accessories"]
    });

    const cameras = await CategoryModel.create({
      name: "Cameras & Photo",
      description: "Photography equipment and accessories",
      parent: electronics._id,
      attributes: [
        { name: "Camera Type", type: "text", required: true },
        { name: "Megapixels", type: "number", required: false },
        { name: "Lens Mount", type: "text", required: false },
      ],
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Electronics", "Cameras & Photo"]
    });

    const tvAudio = await CategoryModel.create({
      name: "TV, Audio & Surveillance",
      description: "Television, audio equipment, and surveillance systems",
      parent: electronics._id,
      attributes: [
        { name: "Screen Size", type: "number", required: false },
        { name: "Resolution", type: "text", required: false },
        { name: "Audio Channels", type: "number", required: false },
      ],
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Electronics", "TV, Audio & Surveillance"]
    });

    // Level 2 Categories (Clothing)
    const mensClothing = await CategoryModel.create({
      name: "Men's Clothing",
      description: "Clothing items for men",
      parent: clothing._id,
      attributes: [
        { name: "Size", type: "select", required: true, options: ["S", "M", "L", "XL", "XXL"] },
        { name: "Fit", type: "select", required: false, options: ["Regular", "Slim", "Relaxed"] },
        { name: "Material", type: "text", required: true },
      ],
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Clothing, Shoes & Accessories", "Men's Clothing"]
    });

    const womensClothing = await CategoryModel.create({
      name: "Women's Clothing",
      description: "Clothing items for women",
      parent: clothing._id,
      attributes: [
        { name: "Size", type: "select", required: true, options: ["XS", "S", "M", "L", "XL"] },
        { name: "Pattern", type: "select", required: false, options: ["Solid", "Printed", "Striped", "Checked"] },
        { name: "Material", type: "text", required: true },
      ],
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Clothing, Shoes & Accessories", "Women's Clothing"]
    });

    const shoes = await CategoryModel.create({
      name: "Shoes",
      description: "Footwear for all genders",
      parent: clothing._id,
      attributes: [
        { name: "Size", type: "number", required: true },
        { name: "Material", type: "text", required: true },
        { name: "Style", type: "text", required: false },
      ],
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Clothing, Shoes & Accessories", "Shoes"]
    });

    const accessories = await CategoryModel.create({
      name: "Accessories",
      description: "Fashion accessories",
      parent: clothing._id,
      attributes: [
        { name: "Type", type: "text", required: true },
        { name: "Material", type: "text", required: true },
      ],
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Clothing, Shoes & Accessories", "Accessories"]
    });

    // Level 3 Categories (Computers & Tablets)
    const laptops = await CategoryModel.create({
      name: "Laptops & Netbooks",
      description: "Portable computers",
      parent: computers._id,
      attributes: [
        { name: "Screen Size", type: "number", required: true },
        { name: "Processor", type: "text", required: true },
        { name: "Graphics Card", type: "text", required: false },
        { name: "Battery Life", type: "text", required: false },
      ],
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Electronics", "Computers & Tablets", "Laptops & Netbooks"]
    });

    const desktops = await CategoryModel.create({
      name: "Desktops & All-In-Ones",
      description: "Non-portable computer systems",
      parent: computers._id,
      attributes: [
        { name: "Form Factor", type: "text", required: true },
        { name: "Processor", type: "text", required: true },
        { name: "Graphics Card", type: "text", required: false },
      ],
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Electronics", "Computers & Tablets", "Desktops & All-In-Ones"]
    });

    const tablets = await CategoryModel.create({
      name: "iPads, Tablets & eReaders",
      description: "Tablet computers and e-readers",
      parent: computers._id,
      attributes: [
        { name: "Screen Size", type: "number", required: true },
        { name: "Storage", type: "number", required: true },
        { name: "Connectivity", type: "select", required: true, options: ["WiFi", "WiFi + Cellular"] },
      ],
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Electronics", "Computers & Tablets", "iPads, Tablets & eReaders"]
    });

    // Level 3 Categories (Cell Phones)
    const smartphones = await CategoryModel.create({
      name: "Smartphones",
      description: "Modern mobile phones with advanced features",
      parent: cellPhones._id,
      attributes: [
        { name: "Operating System", type: "select", required: true, options: ["Android", "iOS", "Other"] },
        { name: "Screen Size", type: "number", required: true },
        { name: "Camera Resolution", type: "text", required: false },
        { name: "5G Compatible", type: "boolean", required: false },
      ],
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Electronics", "Cell Phones & Accessories", "Smartphones"]
    });

    const phoneAccessories = await CategoryModel.create({
      name: "Cell Phone Accessories",
      description: "Cases, chargers, and other accessories",
      parent: cellPhones._id,
      attributes: [
        { name: "Compatible Brand", type: "text", required: true },
        { name: "Compatible Model", type: "text", required: true },
        { name: "Type", type: "text", required: true },
      ],
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Electronics", "Cell Phones & Accessories", "Cell Phone Accessories"]
    });
    
    const smartwatches = await CategoryModel.create({
      name: "Smartwatches & Accessories",
      description: "Wearable smart devices and accessories",
      parent: cellPhones._id,
      attributes: [
        { name: "Compatible OS", type: "select", required: true, options: ["Android", "iOS", "Both", "Other"] },
        { name: "Display Type", type: "text", required: true },
        { name: "Water Resistance", type: "text", required: false },
        { name: "Battery Life", type: "text", required: true },
      ],
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Electronics", "Cell Phones & Accessories", "Smartwatches & Accessories"]
    });
    
    const virtualReality = await CategoryModel.create({
      name: "Virtual Reality Headsets",
      description: "VR and AR headsets and accessories",
      parent: cellPhones._id,
      attributes: [
        { name: "Platform", type: "select", required: true, options: ["Mobile", "PC", "Standalone", "Console"] },
        { name: "Resolution", type: "text", required: true },
        { name: "Field of View", type: "number", required: false },
        { name: "Tracking Type", type: "select", required: true, options: ["3DoF", "6DoF", "External", "None"] },
      ],
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Electronics", "Cell Phones & Accessories", "Virtual Reality Headsets"]
    });

    // Level 3 Categories (Men's Clothing)
    const mensShirts = await CategoryModel.create({
      name: "Shirts",
      description: "Men's shirts and tops",
      parent: mensClothing._id,
      attributes: [
        { name: "Size", type: "select", required: true, options: ["S", "M", "L", "XL", "XXL"] },
        { name: "Sleeve Length", type: "select", required: true, options: ["Short", "Long", "Three-Quarter"] },
        { name: "Collar Type", type: "text", required: false },
      ],
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Clothing, Shoes & Accessories", "Men's Clothing", "Shirts"]
    });

    const mensPants = await CategoryModel.create({
      name: "Pants",
      description: "Men's pants and trousers",
      parent: mensClothing._id,
      attributes: [
        { name: "Size", type: "text", required: true },
        { name: "Inseam", type: "number", required: false },
        { name: "Style", type: "text", required: false },
      ],
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Clothing, Shoes & Accessories", "Men's Clothing", "Pants"]
    });
    
    const mensOuterwear = await CategoryModel.create({
      name: "Outerwear",
      description: "Men's jackets, coats, and outerwear",
      parent: mensClothing._id,
      attributes: [
        { name: "Size", type: "select", required: true, options: ["S", "M", "L", "XL", "XXL"] },
        { name: "Material", type: "text", required: true },
        { name: "Weather Resistance", type: "select", required: false, options: ["Waterproof", "Water Resistant", "Windproof", "None"] },
      ],
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Clothing, Shoes & Accessories", "Men's Clothing", "Outerwear"]
    });
    
    const mensSuits = await CategoryModel.create({
      name: "Suits & Formal Wear",
      description: "Men's suits, blazers, and formal attire",
      parent: mensClothing._id,
      attributes: [
        { name: "Size", type: "text", required: true },
        { name: "Material", type: "text", required: true },
        { name: "Style", type: "select", required: true, options: ["Two-Piece", "Three-Piece", "Tuxedo", "Blazer"] },
        { name: "Fit", type: "select", required: true, options: ["Slim", "Regular", "Athletic", "Classic"] },
      ],
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Clothing, Shoes & Accessories", "Men's Clothing", "Suits & Formal Wear"]
    });
    
    const mensUnderwear = await CategoryModel.create({
      name: "Underwear & Socks",
      description: "Men's undergarments and hosiery",
      parent: mensClothing._id,
      attributes: [
        { name: "Size", type: "select", required: true, options: ["S", "M", "L", "XL", "XXL"] },
        { name: "Material", type: "text", required: true },
        { name: "Type", type: "select", required: true, options: ["Boxers", "Briefs", "Boxer Briefs", "Socks", "Undershirts"] },
      ],
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Clothing, Shoes & Accessories", "Men's Clothing", "Underwear & Socks"]
    });

    // Level 4 Categories (Smartphones)
    const iphones = await CategoryModel.create({
      name: "iPhones",
      description: "Apple iPhone smartphones",
      parent: smartphones._id,
      attributes: [
        { name: "Model", type: "text", required: true },
        { name: "Storage", type: "select", required: true, options: ["64GB", "128GB", "256GB", "512GB", "1TB"] },
        { name: "Color", type: "text", required: true },
      ],
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Electronics", "Cell Phones & Accessories", "Smartphones", "iPhones"]
    });

    const androidPhones = await CategoryModel.create({
      name: "Android Phones",
      description: "Smartphones running Android OS",
      parent: smartphones._id,
      attributes: [
        { name: "Brand", type: "text", required: true },
        { name: "Model", type: "text", required: true },
        { name: "Storage", type: "number", required: true },
        { name: "RAM", type: "number", required: true },
      ],
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Electronics", "Cell Phones & Accessories", "Smartphones", "Android Phones"]
    });

    // Level 4 Categories (Men's Shirts)
    const mensDressShirts = await CategoryModel.create({
      name: "Dress Shirts",
      description: "Men's formal dress shirts",
      parent: mensShirts._id,
      attributes: [
        { name: "Fit", type: "select", required: true, options: ["Regular", "Slim", "Athletic"] },
        { name: "Collar Type", type: "select", required: true, options: ["Spread", "Button Down", "Point", "Wing"] },
        { name: "Cuff Style", type: "text", required: false },
      ],
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Clothing, Shoes & Accessories", "Men's Clothing", "Shirts", "Dress Shirts"]
    });

    const mensCasualShirts = await CategoryModel.create({
      name: "Casual Shirts",
      description: "Men's casual and everyday shirts",
      parent: mensShirts._id,
      attributes: [
        { name: "Style", type: "select", required: true, options: ["T-Shirt", "Polo", "Henley", "Button-Up"] },
        { name: "Pattern", type: "text", required: false },
        { name: "Neckline", type: "text", required: false },
      ],
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Clothing, Shoes & Accessories", "Men's Clothing", "Shirts", "Casual Shirts"]
    });

    // Level 5 Categories (Android Phones)
    const samsungPhones = await CategoryModel.create({
      name: "Samsung Phones",
      description: "Samsung brand Android smartphones",
      parent: androidPhones._id,
      attributes: [
        { name: "Series", type: "select", required: true, options: ["Galaxy S", "Galaxy Note", "Galaxy A", "Galaxy Z"] },
        { name: "Model Number", type: "text", required: true },
        { name: "Screen Technology", type: "text", required: false },
      ],
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Electronics", "Cell Phones & Accessories", "Smartphones", "Android Phones", "Samsung Phones"]
    });

    const googlePhones = await CategoryModel.create({
      name: "Google Phones",
      description: "Google Pixel smartphones",
      parent: androidPhones._id,
      attributes: [
        { name: "Pixel Generation", type: "number", required: true },
        { name: "Model", type: "text", required: true },
        { name: "Special Features", type: "text", required: false },
      ],
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Electronics", "Cell Phones & Accessories", "Smartphones", "Android Phones", "Google Phones"]
    });
    
    const xiaomiPhones = await CategoryModel.create({
      name: "Xiaomi Phones",
      description: "Xiaomi brand Android smartphones",
      parent: androidPhones._id,
      attributes: [
        { name: "Series", type: "select", required: true, options: ["Redmi", "Mi", "POCO", "Black Shark"] },
        { name: "Model Number", type: "text", required: true },
        { name: "MIUI Version", type: "text", required: false },
      ],
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Electronics", "Cell Phones & Accessories", "Smartphones", "Android Phones", "Xiaomi Phones"]
    });
    
    const onePlusPhones = await CategoryModel.create({
      name: "OnePlus Phones",
      description: "OnePlus brand Android smartphones",
      parent: androidPhones._id,
      attributes: [
        { name: "Series", type: "text", required: true },
        { name: "Model Number", type: "text", required: true },
        { name: "OxygenOS Version", type: "text", required: false },
      ],
      isActive: true,
      createdBy: adminId,
      updatedBy: adminId,
      path: ["Electronics", "Cell Phones & Accessories", "Smartphones", "Android Phones", "OnePlus Phones"]
    });

    console.log("Categories seeded successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding categories:", error);
    process.exit(1);
  }
}

seedCategories();