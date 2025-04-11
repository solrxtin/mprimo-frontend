import express from 'express';
import helmet from "helmet";
import { createServer } from 'http';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import passport from 'passport';

import pushNotificationRoutes from './routes/push-notification.routes';
import authRoutes from './routes/auth.routes'
import { requestLogger } from './middlewares/request-logger.middleware';
import { errorLogger } from './middlewares/error-logger.middleware';
import { LoggerService } from './services/logger.service';
import { corsMiddleware } from './middlewares/cors.middleware';
import { SocketService } from './services/socket.service';
import connectDb from './config/connectDb';
import productrouter from './routes/product.route';
import twofactorrouter from './routes/two-factor.routes';
import orderrouter from './routes/order.route';
import cartrouter from './routes/cart.route';

const app = express();
const httpServer = createServer(app);

const logger = LoggerService.getInstance()

// Initialize Socket.IO
const socketService = new SocketService(httpServer);

// Apply CORS middleware before other middleware
app.use(corsMiddleware);
app.use(helmet());
app.use(mongoSanitize()); //Sanitize NoSQL Injection
app.use(xss()); //XSS protection
app.set('trust proxy', true); // tells Express to trust x-forwarded-for from your proxy (not the open internet
// Other middleware and routes
app.use(express.json({ limit: "10mb"}));
app.use(cookieParser());
// app.use(express.urlencoded({ extended: true }));

// Apply request logging middleware
// app.use(requestLogger);

// Initialize passport
// app.use(passport.initialize());
// app.use(passport.session());

// Export for use in other parts of the application
export { socketService };

app.use('/api/v1/push', pushNotificationRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/product', productrouter);
app.use('/api/v1/two-factor', twofactorrouter);
app.use('/api/v1/order', orderrouter);
app.use('/api/v1/cart', cartrouter);

// Error logging middleware should be last
app.use(errorLogger);

export default app

// Start the server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  connectDb()
  console.log(`Server running on port ${PORT}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', error);
    process.exit(1);
});
  
  // Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Rejection', reason as Error);
    process.exit(1);
});