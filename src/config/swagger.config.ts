// import swaggerAutogen from "swagger-autogen";
const swaggerAutogen = require("swagger-autogen")();
const doc = {
  info: {
    title: "Mprimo API Documentation",
    version: "1.0.0",
    description: "Complete API documentation for Mprimo e-commerce platform with Chat & Support System, Shipping, and Subscription Management",
    contact: {
      support: {
        name: "Support",
        email: "support@mprimo.com",
      },
    },
  },
  host: process.env.HOST || "localhost:5800",
  basePath: "/api/v1",
  schemes: ["http", "https"],
  tags: [
    { name: "Authentication", description: "User authentication and authorization" },
    { name: "Products", description: "Product management and catalog" },
    { name: "Orders", description: "Order processing and management" },
    { name: "Users", description: "User account management" },
    { name: "Vendors", description: "Vendor management and operations" },
    { name: "Admin", description: "Administrative functions" },
    { name: "Chat", description: "Real-time messaging system" },
    { name: "Dispute Chat", description: "Dispute resolution messaging" },
    { name: "Shipping", description: "Shipping and logistics management" },
    { name: "Subscription", description: "Vendor subscription management" },
    { name: "Payments", description: "Payment processing and transactions" },
    { name: "Analytics", description: "Analytics and reporting" },
    { name: "Support", description: "Customer support and tickets" }
  ],
  securityDefinitions: {
    Bearer: {
      type: "apiKey",
      name: "Authorization",
      in: "header",
      description: "JWT Authorization header using the Bearer scheme. Example: 'Bearer {token}'"
    }
  },
  definitions: {
    Advertisement: {
      type: "object",
      required: ["title", "description", "targetUrl", "adType", "duration"],
      properties: {
        title: { type: "string", maxLength: 100 },
        description: { type: "string", maxLength: 300 },
        targetUrl: { type: "string" },
        adType: { type: "string", enum: ["banner", "featured", "sponsored"] },
        duration: { type: "number", minimum: 1 }
      }
    },
    Promotion: {
      type: "object",
      required: ["title", "description", "startDate", "endDate"],
      properties: {
        title: { type: "string", maxLength: 100 },
        description: { type: "string", maxLength: 500 },
        status: { type: "string", enum: ["active", "inactive", "expired"] },
        startDate: { type: "string", format: "date-time" },
        endDate: { type: "string", format: "date-time" }
      }
    },
    SupportTicket: {
      type: "object",
      required: ["orderId", "reason", "description"],
      properties: {
        orderId: { type: "string" },
        reason: { type: "string", enum: ["product_issue", "shipping_delay", "payment_issue", "refund_request", "other"] },
        description: { type: "string", maxLength: 1000 },
        priority: { type: "string", enum: ["low", "medium", "high", "urgent"] },
        status: { type: "string", enum: ["open", "in_progress", "resolved", "closed"] }
      }
    },
    Chat: {
      type: "object",
      required: ["participants", "productId"],
      properties: {
        participants: { type: "array", items: { type: "string" } },
        productId: { type: "string" },
        archivedBy: { type: "object" },
        lastMessageTime: { type: "string", format: "date-time" }
      }
    },
    Message: {
      type: "object",
      required: ["chatId", "senderId", "receiverId"],
      properties: {
        chatId: { type: "string" },
        senderId: { type: "string" },
        receiverId: { type: "string" },
        text: { type: "string" },
        messageType: { type: "string", enum: ["text", "file"] },
        attachments: {
          type: "array",
          items: {
            type: "object",
            properties: {
              fileName: { type: "string" },
              fileUrl: { type: "string" },
              fileType: { type: "string", enum: ["image", "document", "video", "audio"] },
              fileSize: { type: "number" },
              mimeType: { type: "string" }
            }
          }
        },
        read: { type: "boolean", default: false }
      }
    },
    Shipment: {
      type: "object",
      required: ["origin", "destination", "weight", "dimensions"],
      properties: {
        origin: { type: "string" },
        destination: { type: "string" },
        weight: { type: "number" },
        dimensions: {
          type: "object",
          properties: {
            length: { type: "number" },
            width: { type: "number" },
            height: { type: "number" }
          }
        },
        serviceType: { type: "string", enum: ["standard", "express", "overnight"] },
        waybill: { type: "string" },
        status: { type: "string", enum: ["pending", "in_transit", "delivered", "failed"] }
      }
    },
    Subscription: {
      type: "object",
      required: ["vendorId", "planName"],
      properties: {
        vendorId: { type: "string" },
        planName: { type: "string" },
        status: { type: "string", enum: ["active", "inactive", "expired"] },
        startDate: { type: "string", format: "date-time" },
        endDate: { type: "string", format: "date-time" },
        features: {
          type: "object",
          properties: {
            productListingLimit: { type: "number" },
            featuredProductSlots: { type: "number" },
            analyticsDashboard: { type: "boolean" },
            customStoreBranding: { type: "boolean" },
            messagingTools: { type: "boolean" },
            bulkUpload: { type: "boolean" },
            prioritySupport: { type: "boolean" }
          }
        }
      }
    }
  }
};

const outputFile = "./swagger-output.json";
const endpointsFiles = ["src/routes/*.ts"];

swaggerAutogen(outputFile, endpointsFiles, doc);