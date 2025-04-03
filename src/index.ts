import express from 'express';
import { createServer } from 'http';
import { SocketService } from './services/socket.service';
import connectDb from './config/connectDb';

import pushNotificationRoutes from './routes/push-notification.routes';
import { requestLogger } from './middlewares/request-logger.middleware';
import { errorLogger } from './middlewares/error-logger.middleware';
import { LoggerService } from './services/logger.service';
import { corsMiddleware } from './middlewares/cors.middleware';

const app = express();
const httpServer = createServer(app);

const logger = LoggerService.getInstance()

// Initialize Socket.IO
const socketService = new SocketService(httpServer);

// Apply CORS middleware before other middleware
app.use(corsMiddleware);

// Other middleware and routes
app.use(express.json({ limit: "10mb"}));
// app.use(express.urlencoded({ extended: true }));

// Apply request logging middleware
app.use(requestLogger);

// Export for use in other parts of the application
export { socketService };

app.use('/api/v1/push', pushNotificationRoutes);

// Error logging middleware should be last
app.use(errorLogger);

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