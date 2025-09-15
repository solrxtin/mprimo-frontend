# Mprimo API Documentation Update

## Overview
This document outlines the new API routes that have been added to the Mprimo e-commerce platform, focusing on the Chat & Support System, Shipping Management, and Subscription Management features.

## New Route Categories

### 1. Dispute Chat System (`/api/v1/dispute-chat`)

The dispute chat system allows users to communicate with support agents regarding order issues through real-time messaging with file sharing capabilities.

#### Routes:
- **GET** `/dispute-chat/{issueId}` - Get dispute chat messages
- **POST** `/dispute-chat/{issueId}/messages` - Send text message
- **POST** `/dispute-chat/{issueId}/media/image` - Upload and send image
- **POST** `/dispute-chat/{issueId}/media/video` - Upload and send video
- **POST** `/dispute-chat/{issueId}/media/document` - Upload and send document
- **PATCH** `/dispute-chat/{issueId}/read` - Mark messages as read

#### Features:
- Real-time messaging with WebSocket support
- File attachments (images, videos, documents)
- Security scanning for uploaded files
- Message read status tracking
- Support for multiple file types with size limits

### 2. Shipping Management (`/api/v1/shipping`)

Comprehensive shipping and logistics management system with support for multiple carriers and tracking.

#### Routes:
- **POST** `/shipping/price` - Calculate shipping costs
- **POST** `/shipping/dropoff/price` - Calculate drop-off shipping costs
- **POST** `/shipping/create` - Create new shipment
- **POST** `/shipping/dropoff/create` - Create drop-off shipment
- **GET** `/shipping/track/{waybill}` - Track shipment by waybill
- **GET** `/shipping/stations/local` - Get local shipping stations
- **GET** `/shipping/stations/international` - Get international stations
- **GET** `/shipping/stations/{stationId}/centres` - Get service centres
- **POST** `/shipping/determine-type` - Determine shipment type (local/international)

#### Features:
- Multi-carrier support
- Real-time tracking
- Cost calculation with multiple service types
- Station and service centre management
- Automatic shipment type detection

### 3. Subscription Management (`/api/v1/subscription`)

Vendor subscription system with tiered plans and feature management.

#### Routes:
- **GET** `/subscription/plans` - Get all subscription plans
- **GET** `/subscription/vendor/{vendorId}` - Get vendor's current subscription
- **POST** `/subscription/vendor/{vendorId}/upgrade` - Upgrade subscription plan
- **GET** `/subscription/vendor/{vendorId}/limits` - Check subscription limits
- **GET** `/subscription/vendor/{vendorId}/wallet` - Get vendor wallet information
- **POST** `/subscription/vendor/{vendorId}/payout` - Request payout
- **GET** `/subscription/vendor/{vendorId}/payouts` - Get payout history

#### Features:
- Tiered subscription plans (Basic, Professional, Enterprise)
- Feature-based access control
- Usage limit enforcement
- Wallet and payout management
- Automatic billing and renewals

## Enhanced Models and Definitions

### SupportTicket
```json
{
  "orderId": "string",
  "reason": "product_issue|shipping_delay|payment_issue|refund_request|other",
  "description": "string (max 1000 chars)",
  "priority": "low|medium|high|urgent",
  "status": "open|in_progress|resolved|closed"
}
```

### Chat
```json
{
  "participants": ["userId1", "userId2"],
  "productId": "string",
  "archivedBy": {},
  "lastMessageTime": "ISO date string"
}
```

### Message
```json
{
  "chatId": "string",
  "senderId": "string",
  "receiverId": "string",
  "text": "string",
  "messageType": "text|file",
  "attachments": [
    {
      "fileName": "string",
      "fileUrl": "string",
      "fileType": "image|document|video|audio",
      "fileSize": "number",
      "mimeType": "string"
    }
  ],
  "read": "boolean"
}
```

### Shipment
```json
{
  "origin": "string",
  "destination": "string",
  "weight": "number",
  "serviceType": "standard|express|overnight",
  "waybill": "string",
  "status": "pending|in_transit|delivered|failed"
}
```

### Subscription
```json
{
  "vendorId": "string",
  "planName": "string",
  "status": "active|inactive|expired",
  "startDate": "ISO date string",
  "endDate": "ISO date string",
  "features": {
    "productListingLimit": "number",
    "featuredProductSlots": "number",
    "analyticsDashboard": "boolean",
    "customStoreBranding": "boolean",
    "messagingTools": "boolean",
    "bulkUpload": "boolean",
    "prioritySupport": "boolean"
  }
}
```

## Authentication & Authorization

All new routes require proper authentication using JWT tokens:
```
Authorization: Bearer <jwt_token>
```

### Role-based Access:
- **Admin**: Full access to all routes
- **Vendor**: Access to vendor-specific routes and subscription management
- **User**: Access to chat and shipping tracking
- **Support**: Access to dispute chat and support ticket management

## File Upload Specifications

### Supported File Types:
- **Images**: JPEG, PNG, GIF (max 5MB)
- **Videos**: MP4, MOV, AVI (max 50MB)
- **Documents**: PDF, DOC, DOCX, XLS, XLSX, TXT (max 10MB)

### Security Features:
- Virus scanning for all uploads
- File type validation
- Size limit enforcement
- Secure file storage with CDN delivery

## Rate Limiting

New routes implement rate limiting to prevent abuse:
- **Chat messages**: 100 messages per minute per user
- **File uploads**: 10 uploads per minute per user
- **Shipping queries**: 50 requests per minute per user
- **Subscription operations**: 10 requests per minute per vendor

## WebSocket Events

### Chat System Events:
- `message_received` - New message in chat
- `message_read` - Message marked as read
- `user_typing` - User is typing
- `file_uploaded` - File attachment uploaded

### Shipping Events:
- `shipment_created` - New shipment created
- `tracking_updated` - Shipment status updated
- `delivery_confirmed` - Package delivered

## Error Handling

Standardized error responses across all new routes:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": "Additional error details"
  }
}
```

## Testing

All new routes include comprehensive test coverage:
- Unit tests for controllers and services
- Integration tests for API endpoints
- End-to-end tests for complete workflows
- Performance tests for high-load scenarios

## Deployment Notes

### Environment Variables:
```env
# Shipping Configuration
SHIPPING_API_KEY=your_shipping_api_key
SHIPPING_WEBHOOK_SECRET=your_webhook_secret

# File Upload Configuration
MAX_FILE_SIZE_MB=50
ALLOWED_FILE_TYPES=jpg,jpeg,png,gif,pdf,doc,docx,mp4,mov

# Chat Configuration
CHAT_MESSAGE_LIMIT=100
CHAT_FILE_LIMIT=10

# Subscription Configuration
STRIPE_SUBSCRIPTION_WEBHOOK_SECRET=your_stripe_webhook_secret
```

### Database Migrations:
Run the following migrations to support new features:
```bash
npm run migrate:chat-system
npm run migrate:shipping-tables
npm run migrate:subscription-plans
```

## Monitoring and Analytics

New monitoring endpoints for system health:
- `/api/v1/health/chat` - Chat system health
- `/api/v1/health/shipping` - Shipping service health
- `/api/v1/health/subscriptions` - Subscription system health

## Next Steps

1. **Frontend Integration**: Update frontend components to use new API routes
2. **Mobile App**: Implement mobile-specific endpoints for chat and shipping
3. **Third-party Integrations**: Add more shipping carriers and payment providers
4. **Advanced Analytics**: Implement detailed reporting for new features
5. **Performance Optimization**: Add caching layers for frequently accessed data

## Support

For questions about the new API routes, contact:
- **Technical Support**: tech-support@mprimo.com
- **API Documentation**: api-docs@mprimo.com
- **Developer Portal**: https://developers.mprimo.com