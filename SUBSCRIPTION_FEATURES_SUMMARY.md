# Subscription Feature Restrictions Summary

## Features Added with Subscription Checks

### 1. Product Management
- **Add Product**: Checks `productListingLimit` before allowing product creation
- **Feature Product**: Checks `featuredProductSlots` before allowing product to be featured
- **Bulk Upload**: Requires `bulkUpload` permission for multiple variants

### 2. Analytics Dashboard
- **View Analytics**: Requires `analyticsDashboard` permission to access detailed analytics
- **Dashboard Summary**: Pro/Elite plans only

### 3. Payout Options
- **Instant Payouts**: Elite plan only (`instant_payout`)
- **Bi-weekly Payouts**: Pro/Elite plans (`bi_weekly_payout`)
- **Weekly Payouts**: Available on all plans

### 4. Messaging & Communication
- **File Sharing**: Requires `full_messaging` (Pro/Elite) to send files in dispute chats
- **Priority Support**: Based on `prioritySupport` level

### 5. Advertising
- **Create Ads**: Requires `adCreditMonthly > 0` to create advertisements
- **Ad Credits**: Monthly allocation based on subscription plan

### 6. Store Branding
- **Custom Branding**: Requires `customStoreBranding !== 'none'`
- **Premium Branding**: Elite plan only (`premium_branding`)

## Subscription Plan Limits

### Starter Plan
- 10 products max
- 0 featured products
- Weekly payouts only
- Basic messaging (text only)
- No analytics dashboard
- No ad credits
- No custom branding

### Pro Plan
- 100 products max
- 5 featured products
- Bi-weekly + weekly payouts
- Full messaging (with files)
- Analytics dashboard
- $50 monthly ad credits
- Basic custom branding
- Basic priority support

### Elite Plan
- Unlimited products
- 20 featured products
- All payout options (instant, bi-weekly, weekly)
- Priority messaging
- Advanced analytics
- $200 monthly ad credits
- Premium branding
- Premium priority support

## Error Messages
All subscription restrictions return clear upgrade messages:
- "Feature requires Pro/Elite plan. Upgrade to access [feature]."
- "Limit reached for your subscription plan. Upgrade to increase limits."

## Middleware Available
- `checkSubscriptionLimit(action, errorMessage?)` - General subscription check
- `requireFeature(feature)` - Shorthand for feature requirements

## Usage Example
```typescript
// In routes
router.post('/products', verifyToken, requireFeature('add_product'), createProduct);
router.get('/analytics', verifyToken, requireFeature('analytics_dashboard'), getAnalytics);
```