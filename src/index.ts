import express from "express";
import helmet from "helmet";
import { createServer } from "http";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";
// import xss from "xss-clean";
import passport from "passport";
import session from "express-session";

import * as swaggerUi from "swagger-ui-express";
import dotenv from "dotenv";

dotenv.config();

import pushNotificationRoutes from "./routes/push-notification.routes";
import authRoutes from "./routes/auth.routes";
import categoryRoutes from "./routes/category.routes";
import orderRoutes from "./routes/order.routes";
import productRoutes from "./routes/product.routes";
import notificationRoutes from "./routes/notifications.routes";
import analyticsRoutes from "./routes/analytics.routes";
import auditLogRoutes from "./routes/audit-log.routes";
import twoFactorRoutes from "./routes/two-factor.routes";
import walletRoutes from "./routes/wallet.route";
import adminRoutes from "./routes/admin.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import messageRoutes from "./routes/message.routes";
import reviewsRoutes from "./routes/review.routes";
import webhookRoutes from './routes/webhook.routes';
import vendorRoutes from "./routes/vendor.routes";
import userRoutes from "./routes/user.route";
import paymentRoutes from "./routes/payment.routes";
import subscriptionRoutes from "./routes/subscription.routes";
import issueRoutes from "./routes/issue.routes";
import refundRoutes from "./routes/refund.routes";
import vendorPayoutRoutes from "./routes/vendor-payout.routes";
import disputeChatRoutes from "./routes/dispute-chat.routes";
import bannerRoutes from "./routes/banner.routes";
import checkoutRoutes from "./routes/checkout.routes";
import verificationRoutes from "./routes/vendor-verification.routes";
import advertisementRoutes from "./routes/advertisement.routes";


import { requestLogger } from "./middlewares/request-logger.middleware";
import { errorLogger } from "./middlewares/error-logger.middleware";
import { LoggerService } from "./services/logger.service";
import { corsMiddleware } from "./middlewares/cors.middleware";
import { SocketService } from "./services/socket.service";
import redisService from "./services/redis.service";
import connectDb from "./config/connectDb";
import { setPreferencesMiddleware } from "./middlewares/country-prefrences.middleware";
import { CryptoPaymentService } from "./services/crypto-payment.service";
import cryptoWalletModel from "./models/cryptoWallet.model";

const app = express();
const httpServer = createServer(app);

const logger = LoggerService.getInstance();
let swaggerDoc: any = {};
try {
  swaggerDoc = require("../swagger-output.json");
  console.log("Swagger doc loaded, paths count:", Object.keys(swaggerDoc.paths || {}).length);
  // Update host for production
  if (swaggerDoc) {
    swaggerDoc.host = "mprimo.up.railway.app";
    swaggerDoc.schemes = ["https"];
  }
} catch (error) {
  console.error("Swagger documentation not found:", error);
  swaggerDoc = {
    swagger: "2.0",
    info: {
      title: "Mprimo API",
      version: "1.0.0",
      description: "Mprimo e-commerce platform API"
    },
    host: "mprimo.up.railway.app",
    basePath: "/api/v1",
    schemes: ["https"],
    paths: {}
  };
}

// Initialize Socket.IO
const socketService = new SocketService(httpServer);

// Apply CORS middleware before other middleware
app.use(corsMiddleware);
// Webhooks must be before express.json middleware
app.use('/api/v1/webhooks', webhookRoutes);
app.use(helmet());
// app.use(
//   mongoSanitize({
//     onSanitize: ({ req, key }) => {
//       console.warn(`Sanitized ${key} in request ${req.method} ${req.url}`);
//     },
//     replaceWith: "_", // Prevents modifying req.query directly
//   })
// );//Sanitize NoSQL Injection
// app.use(xss()); //XSS protection - package not installed
// app.set('trust proxy', true); // tells Express to trust x-forwarded-for from your proxy (not the open internet)
// Other middleware and routes
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  session({
    secret: process.env.SECRET!,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === "production" }, // Set to `true` in production if using HTTPS
  })
);

// Apply request logging middleware
// app.use(requestLogger);

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Export for use in other parts of the application
export { socketService, redisService };

const io = socketService.getIO();

// Initialize crypto payment service and start watching transfers
const cryptoPaymentService = new CryptoPaymentService();
const tokenWatcher = cryptoPaymentService.startWatchingTokenTransfers(io);

async function initializeWalletWatching() {
  try {
    const wallets = await cryptoWalletModel.find({});
    wallets.forEach((wallet) => {
      tokenWatcher.addAddressToWatch(wallet.address);
    });
    console.log(`Started watching ${wallets.length} wallets for token transfers`);
  } catch (error) {
    console.error('Error initializing wallet watching:', error);
  }
}

initializeWalletWatching();
export {tokenWatcher}

app.use(setPreferencesMiddleware);

// Add debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

app.use("/api/v1/push", pushNotificationRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/analytics", analyticsRoutes);
app.use("/api/v1/audit-logs", auditLogRoutes);
app.use("/api/v1/two-factor", twoFactorRoutes);
app.use("/api/v1/wallets", walletRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/messages", messageRoutes);
app.use("/api/v1/reviews", reviewsRoutes);
app.use("/api/v1/vendor", vendorRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/subscriptions", subscriptionRoutes);
app.use("/api/v1/issues", issueRoutes);
app.use("/api/v1/refunds", refundRoutes);
app.use("/api/v1/vendor-payouts", vendorPayoutRoutes);
app.use("/api/v1/dispute-chat", disputeChatRoutes);
app.use("/api/v1/banners", bannerRoutes);
app.use("/api/v1/checkout", checkoutRoutes);
app.use("/api/v1/verification", verificationRoutes);
app.use("/api/v1/advertisements", advertisementRoutes);


app.get("/health", (req, res) => {res.json({message: "OK"})})  //Monitor app to see if it's up

// Debug routes
app.get("/api/v1/test", (req, res) => {res.json({message: "API v1 working"})});
app.get("/api/v1/products/test", (req, res) => {res.json({message: "Products route working"})});

// Debug swagger file existence
app.get("/api/v1/debug/swagger", (req, res) => {
  const fs = require('fs');
  const path = require('path');
  
  const swaggerPath = path.join(__dirname, '../swagger-output.json');
  const exists = fs.existsSync(swaggerPath);
  
  let fileContent = null;
  if (exists) {
    try {
      fileContent = JSON.parse(fs.readFileSync(swaggerPath, 'utf8'));
    } catch (error: any) {
      fileContent = { error: error.message };
    }
  }
  
  res.json({
    swaggerFileExists: exists,
    swaggerPath,
    currentDir: __dirname,
    pathsCount: fileContent?.paths ? Object.keys(fileContent.paths).length : 0,
    fileContent: exists ? 'File exists' : 'File not found'
  });
});

// Serve Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDoc));
app.get("/docs-json", (req, res) => {
  res.json(swaggerDoc);
});

// Error logging middleware should be last
// app.use(errorLogger);

export default app;

// Start the server
const PORT = process.env.PORT || 5000;
(async () => {
  try {
    await connectDb();
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Swagger UI at http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    logger.error("Failed to connect DB", error);
    process.exit(1);
  }
})();


// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception", error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled Rejection", reason as Error);
  process.exit(1);
});