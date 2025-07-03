# Marketplace Solutions

## 1. Product Variations & Inventory Management

### Current Problem
- Base product has quantity (10) and price fields
- Variants also have quantity (5) and price (180000)
- Confusion about which takes precedence

### Proposed Solution
```typescript
// Product Model Changes
inventory: {
  // Remove base quantity and price - variants handle everything
  sku: String,
  lowStockAlert: Number,
  listing: {
    type: "instant" | "auction",
    // No base quantity/price here
  }
},

variants: [
  {
    name: "Color", // e.g., "Color", "Size", "Storage"
    isDefault: Boolean, // One variant must be default
    options: [
      {
        value: "Black", // e.g., "Black", "Large", "256GB"
        sku: String, // Unique SKU per variant
        price: 180000,
        salePrice: 160000, // Optional
        quantity: 5,
        isDefault: Boolean // One option per variant must be default
      }
    ]
  }
]
```

### Implementation Logic
1. **No Variants**: Auto-create default variant with base values
2. **With Variants**: All inventory/pricing comes from variants
3. **Frontend**: Always work with variants, never base product
4. **Total Stock**: Sum of all variant quantities

## 2. Multi-Currency Support

### Proposed Solution
```typescript
// Add to Country Model
const CountrySchema = new mongoose.Schema({
  name: String,
  currency: String,
  exchangeRate: Number, // Rate to USD
  symbol: String, // $, ₦, £
  delisted: Boolean
});

// Add Currency Service
class CurrencyService {
  static async convertPrice(amount: number, fromCurrency: string, toCurrency: string) {
    // Implementation with exchange rate API
  }
  
  static async getExchangeRates() {
    // Fetch from external API (exchangerate-api.com)
  }
}

// Product Response Enhancement
{
  "product": {
    "basePrice": 1000, // Original price in product's currency
    "baseCurrency": "USD",
    "displayPrice": 850000, // Converted to user's currency
    "displayCurrency": "NGN",
    "exchangeRate": 850
  }
}
```

## 3. Cart & Wishlist Architecture

### Current Problem
- User model has cart/wishlist arrays
- Separate Cart/Wishlist models exist
- Redis caching for both
- Inconsistent data sources

### Proposed Solution: **Use Redis as Primary, MongoDB as Backup**

```typescript
// Remove cart/wishlist from User model
// Keep separate Cart/Wishlist models for persistence
// Redis as primary storage for performance

class CartService {
  // Always try Redis first, fallback to MongoDB
  async getCart(userId: string) {
    let cart = await redisService.getCart(userId);
    if (!cart.length) {
      cart = await Cart.findOne({ userId });
      if (cart) await redisService.syncCart(userId, cart.items);
    }
    return cart;
  }
  
  // Write to both Redis and MongoDB
  async addToCart(userId: string, item: CartItem) {
    await redisService.addToCart(userId, item);
    await Cart.findOneAndUpdate(
      { userId },
      { $push: { items: item }, lastUpdated: new Date() },
      { upsert: true }
    );
  }
}
```

## 4. Bulk Product Import

### Proposed Solutions

#### A. CSV Import
```typescript
// Add to Product Controller
async bulkImportCSV(req: Request, res: Response) {
  const file = req.file; // multer upload
  const results = await csvParser(file.buffer);
  
  const products = [];
  for (const row of results) {
    const product = await this.validateAndCreateProduct(row, req.userId);
    products.push(product);
  }
  
  res.json({ imported: products.length, products });
}
```

#### B. JSON Import
```typescript
async bulkImportJSON(req: Request, res: Response) {
  const { products } = req.body;
  const results = [];
  
  for (const productData of products) {
    try {
      const product = await Product.create({
        ...productData,
        vendorId: req.vendorId
      });
      results.push({ success: true, product });
    } catch (error) {
      results.push({ success: false, error: error.message, data: productData });
    }
  }
  
  res.json({ results });
}
```

#### C. External API Integration
```typescript
// Add API integration service
class ProductImportService {
  async importFromShopify(apiKey: string, storeUrl: string) {
    // Shopify API integration
  }
  
  async importFromWooCommerce(apiKey: string, storeUrl: string) {
    // WooCommerce API integration
  }
  
  async importFromSquare(accessToken: string) {
    // Square API integration
  }
}
```

#### D. Database Import
```typescript
async importFromDatabase(connectionString: string, tableName: string) {
  // Connect to external database
  // Map fields to product schema
  // Bulk import with validation
}
```

### Import Template Structure
```json
{
  "name": "Product Name",
  "brand": "Brand Name",
  "description": "Product description",
  "condition": "new",
  "category": "Electronics > Smartphones",
  "images": ["url1", "url2"],
  "variants": [
    {
      "name": "Color",
      "options": [
        {
          "value": "Black",
          "price": 100000,
          "quantity": 10,
          "sku": "PROD-BLACK-001"
        }
      ]
    }
  ],
  "specifications": [
    {"key": "Brand", "value": "Apple"},
    {"key": "Model", "value": "iPhone 15"}
  ],
  "shipping": {
    "weight": 0.2,
    "dimensions": {"length": 15, "width": 7, "height": 1}
  }
}
```

## Implementation Priority

1. **Phase 1**: Fix product variants (most critical)
2. **Phase 2**: Implement multi-currency
3. **Phase 3**: Standardize cart/wishlist architecture  
4. **Phase 4**: Add bulk import features

## Benefits

- **Variants**: Clear inventory management, no confusion
- **Currency**: Better user experience, global marketplace
- **Cart/Wishlist**: Performance + reliability
- **Bulk Import**: Vendor onboarding, competitive advantage

Would you like me to proceed with implementing any of these solutions?