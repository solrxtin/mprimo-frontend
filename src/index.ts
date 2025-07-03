import express from "express";
import helmet from "helmet";
import { createServer } from "http";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";
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
import dashboardRoutes from "./routes/dashboard.routes"
import messageRoutes from "./routes/message.routes";
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
const swaggerDoc = require("./swagger-output.json");

// Initialize Socket.IO
const socketService = new SocketService(httpServer);

// Apply CORS middleware before other middleware
app.use(corsMiddleware);
app.use(helmet());
// app.use(
//   mongoSanitize({
//     onSanitize: ({ req, key }) => {
//       console.warn(`Sanitized ${key} in request ${req.method} ${req.url}`);
//     },
//     replaceWith: "_", // Prevents modifying req.query directly
//   })
// );//Sanitize NoSQL Injection
// app.use(xss()); //XSS protection
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

app.get("/health", (req, res) => {res.json({message: "OK"})})  //Monitor app to see if it's up

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