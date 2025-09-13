const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: {
    title: "Mprimo API Documentation",
    version: "1.0.0",
    description: "Complete API documentation for Mprimo e-commerce platform",
  },
  host: "localhost:5800",
  basePath: "/api/v1",
  schemes: ["http", "https"],
  securityDefinitions: {
    Bearer: {
      type: "apiKey",
      name: "Authorization", 
      in: "header"
    }
  },
  definitions: {
    User: {
      type: "object",
      properties: {
        email: { type: "string" },
        profile: {
          type: "object",
          properties: {
            firstName: { type: "string" },
            lastName: { type: "string" },
            phoneNumber: { type: "string" }
          }
        }
      }
    },
    Product: {
      type: "object",
      properties: {
        name: { type: "string" },
        description: { type: "string" },
        price: { type: "number" },
        category: { type: "string" },
        images: { type: "array", items: { type: "string" } }
      }
    },
    Order: {
      type: "object", 
      properties: {
        userId: { type: "string" },
        items: { type: "array" },
        status: { type: "string" },
        totalAmount: { type: "number" }
      }
    },
    Advertisement: {
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        adType: { type: "string", enum: ["banner", "featured", "sponsored"] },
        duration: { type: "number" }
      }
    },
    Promotion: {
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        status: { type: "string", enum: ["active", "inactive", "expired"] },
        startDate: { type: "string" },
        endDate: { type: "string" }
      }
    },
    Banner: {
      type: "object",
      properties: {
        title: { type: "string" },
        imageUrl: { type: "string" },
        targetUrl: { type: "string" },
        position: { type: "string" }
      }
    },
    FAQ: {
      type: "object",
      properties: {
        question: { type: "string" },
        answer: { type: "string" },
        category: { type: "string" },
        tags: { type: "array", items: { type: "string" } }
      }
    },
    Policy: {
      type: "object",
      properties: {
        title: { type: "string" },
        content: { type: "string" },
        category: { type: "string" },
        status: { type: "string" }
      }
    },
    Issue: {
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        priority: { type: "string", enum: ["low", "medium", "high", "urgent"] },
        status: { type: "string" }
      }
    },
    Refund: {
      type: "object",
      properties: {
        orderId: { type: "string" },
        amount: { type: "number" },
        reason: { type: "string" },
        status: { type: "string" }
      }
    },
    Vendor: {
      type: "object",
      properties: {
        businessInfo: {
          type: "object",
          properties: {
            name: { type: "string" },
            registrationNumber: { type: "string" }
          }
        },
        status: { type: "string" },
        kycStatus: { type: "string" }
      }
    },
    Wallet: {
      type: "object",
      properties: {
        balance: { type: "number" },
        currency: { type: "string" },
        transactions: { type: "array" }
      }
    },
    Category: {
      type: "object",
      properties: {
        name: { type: "string" },
        description: { type: "string" },
        parent: { type: "string" },
        isActive: { type: "boolean" }
      }
    },
    Country: {
      type: "object",
      properties: {
        name: { type: "string" },
        currency: { type: "string" },
        currencySymbol: { type: "string" },
        exchangeRate: { type: "number" }
      }
    },
    Notification: {
      type: "object",
      properties: {
        title: { type: "string" },
        message: { type: "string" },
        type: { type: "string" },
        isRead: { type: "boolean" }
      }
    }
  }
};

const outputFile = './src/swagger-output.json';
const endpointsFiles = [
  './src/routes/auth.routes.ts',
  './src/routes/admin.routes.ts',
  './src/routes/vendor.routes.ts',
  './src/routes/user.route.ts',
  './src/routes/product.routes.ts',
  './src/routes/order.routes.ts',
  './src/routes/payment.routes.ts',
  './src/routes/wallet.route.ts',
  './src/routes/category.routes.ts',
  './src/routes/banner.routes.ts',
  './src/routes/notifications.routes.ts',
  './src/routes/issue.routes.ts',
  './src/routes/refund.routes.ts',
  './src/routes/vendor-payout.routes.ts',
  './src/routes/dispute-chat.routes.ts',
  './src/routes/analytics.routes.ts',
  './src/routes/audit-log.routes.ts',
  './src/routes/checkout.routes.ts',
  './src/routes/dashboard.routes.ts',
  './src/routes/message.routes.ts',
  './src/routes/push-notification.routes.ts',
  './src/routes/review.routes.ts',
  './src/routes/subscription.routes.ts',
  './src/routes/two-factor.routes.ts',
  './src/routes/verification.routes.ts',
  './src/routes/webhook.routes.ts',
  './src/routes/product-import.routes.ts'
];

swaggerAutogen(outputFile, endpointsFiles, doc);