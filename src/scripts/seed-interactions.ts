import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/user.model";
import Product from "../models/product.model";
import Cart, { WishList } from "../models/cart.model";
import Order from "../models/order.model";
import Payment from "../models/payment.model";
import { Chat, Message } from "../models/chat.model";
import { LoggerService } from "../services/logger.service";
import redisService from "../services/redis.service";
import { generateTrackingNumber } from "../utils/generateTrackingNumber";
import Vendor from "../models/vendor.model";

dotenv.config();

const logger = LoggerService.getInstance();
const MONGO_URI = process.env.MONGODB_URI!;

async function seedInteractions() {
  try {
    // Check if already connected, if not connect
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(MONGO_URI);
      console.log("Connected to MongoDB");
    } else {
      console.log("Using existing MongoDB connection");
    }

    // Get all personal users and products
    const users = await User.find({ role: "personal" }).limit(30);
    const products = await Product.find({ status: "active" }).limit(100);

    if (!users.length || !products.length) {
      throw new Error("Please seed users and products first");
    }

    console.log(`Found ${users.length} users and ${products.length} products`);

    // Clear existing interactions and analytics
    await Cart.deleteMany({});
    await WishList.deleteMany({});
    await Order.deleteMany({});
    await Payment.deleteMany({});
    await Chat.deleteMany({});
    await Message.deleteMany({});
    
    // Clear analytics to prevent duplicate key errors
    const AnalyticsModel = mongoose.model('Analytics');
    await AnalyticsModel.deleteMany({});
    console.log("Cleared existing interactions, orders, payments, messages, and analytics");

    let cartCount = 0;
    let wishlistCount = 0;
    let orderCount = 0;
    let messageCount = 0;
    
    // Get vendors for orders and messaging
    const vendors = await User.find({ role: "business" });
    const vendorDocs = await Vendor.find({});
    const paymentMethods = ['credit_card', 'paypal', 'crypto'];
    const orderStatuses = ['pending', 'processing', 'delivered'];
    const shippingStatuses = ['pending', 'processing', 'shipped', 'delivered'];

    // Create cart and wishlist items for each user
    for (const user of users) {
      try {
        // Track product views for analytics
        const viewedProducts = products.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 5) + 1);
        for (const product of viewedProducts) {
          await redisService.trackEvent(product._id.toString(), "view", user._id);
        }

        // 80% chance user has items in cart
        if (Math.random() > 0.2) {
          const cartItemsCount = Math.floor(Math.random() * 5) + 1; // 1-5 items
          const cartProducts = products
            .sort(() => 0.5 - Math.random())
            .slice(0, cartItemsCount);

          const cartItems = cartProducts.map(product => {
            let price = 50; // default price
            let variantId = 'DEFAULT-SKU';
            
            if (product.variants && product.variants.length > 0) {
              const firstVariant = product.variants[0];
              if (firstVariant.options && firstVariant.options.length > 0) {
                const firstOption = firstVariant.options[0];
                price = firstOption.price;
                variantId = firstOption.sku;
              }
            }
            
            return {
              productId: product._id,
              variantId: variantId,
              quantity: Math.floor(Math.random() * 3) + 1,
              price: price,
              addedAt: new Date()
            };
          });

          // Create in MongoDB
          await Cart.create({
            userId: user._id,
            items: cartItems,
            lastUpdated: new Date()
          });

          // Also add to Redis cache and track events
          for (const item of cartItems) {
            const product = products.find(p => p._id.equals(item.productId));
            if (product?.variants && product.variants.length > 0) {
              const firstVariant = product.variants[0];
              if (firstVariant.options && firstVariant.options.length > 0) {
                const firstOption = firstVariant.options[0];
                await redisService.addToCart(
                  user._id.toString(),
                  item.productId.toString(),
                  item.quantity,
                  firstOption.price,
                  firstOption.sku
                );
                // Track add to cart event
                await redisService.trackEvent(item.productId.toString(), "addToCart", user._id);
              }
            }
          }

          cartCount++;
        }

        // 60% chance user has wishlist items
        if (Math.random() > 0.4) {
          const wishlistItemsCount = Math.floor(Math.random() * 8) + 2; // 2-9 items
          const wishlistProducts = products
            .sort(() => 0.5 - Math.random())
            .slice(0, wishlistItemsCount);

          const wishlistItems = wishlistProducts.map(product => {
            let price = 0;
            if (product.variants && product.variants.length > 0) {
              const firstVariant = product.variants[0];
              if (firstVariant.options && firstVariant.options.length > 0) {
                price = firstVariant.options[0].price;
              }
            }
            return {
              productId: product._id,
              addedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
              priceWhenAdded: price,
              currency: 'USD'
            };
          });

          // Create in MongoDB
          await WishList.create({
            userId: user._id,
            items: wishlistItems
          });

          // Also add to Redis cache and track events
          for (const item of wishlistItems) {
            await redisService.addToWishlist(
              user._id.toString(),
              item.productId.toString()
            );
            // Track wishlist event
            await redisService.trackEvent(item.productId.toString(), "wishlist", user._id);
          }

          wishlistCount++;
        }

        // 70% chance user makes orders
        if (Math.random() > 0.3) {
          const orderItemsCount = Math.floor(Math.random() * 3) + 1; // 1-3 orders
          
          for (let i = 0; i < orderItemsCount; i++) {
            const orderProducts = products
              .sort(() => 0.5 - Math.random())
              .slice(0, Math.floor(Math.random() * 2) + 1); // 1-2 items per order
            
            const orderItems = orderProducts.map(product => {
              let price = 50; // default price
              let variantId = 'DEFAULT-SKU';
              
              if (product.variants && product.variants.length > 0) {
                const firstVariant = product.variants[0];
                if (firstVariant.options && firstVariant.options.length > 0) {
                  const firstOption = firstVariant.options[0];
                  price = firstOption.price;
                  variantId = firstOption.sku;
                }
              }
              
              return {
                productId: product._id,
                variantId: variantId,
                quantity: Math.floor(Math.random() * 2) + 1,
                price: price
              };
            });
            
            const totalAmount = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
            const orderStatus = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
            const shippingStatus = shippingStatuses[Math.floor(Math.random() * shippingStatuses.length)];
            
            // Create order
            const order = await Order.create({
              userId: user._id,
              items: orderItems,
              payment: {
                method: paymentMethod,
                status: orderStatus === 'delivered' ? 'completed' : 'pending',
                transactionId: orderStatus === 'delivered' ? `txn_${Math.random().toString(36).substring(2, 15)}` : undefined,
                amount: totalAmount,
                currency: 'USD'
              },
              shipping: {
                address: {
                  street: '123 Main St',
                  city: 'Sample City',
                  state: 'Sample State',
                  country: 'Sample Country',
                  postalCode: '12345'
                },
                carrier: shippingStatus !== 'pending' ? 'fedex' : undefined,
                trackingNumber: shippingStatus !== 'pending' ? generateTrackingNumber() : undefined,
                status: shippingStatus,
                estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
              },
              status: orderStatus
            });
            
            // Track purchase events
            for (const item of orderItems) {
              await redisService.trackEvent(item.productId.toString(), "purchase", user._id, item.price * item.quantity);
            }
            
            // Create payment record
            await Payment.create({
              orderId: order._id,
              userId: user._id,
              amount: totalAmount,
              currency: 'USD',
              method: paymentMethod,
              gateway: paymentMethod === 'crypto' ? 'blockchain' : 'stripe',
              status: orderStatus === 'delivered' ? 'completed' : 'pending',
              transactionId: orderStatus === 'delivered' ? `txn_${Math.random().toString(36).substring(2, 15)}` : undefined,
              createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
            });
            
            orderCount++;
          }
        }
      } catch (error) {
        console.error(`Error creating interactions for user ${user._id}:`, error);
      }
    }

    // Generate related products data
    console.log('Generating related products data...');
    for (const product of products) {
      try {
        // Get random related products from same category
        const relatedProducts = products
          .filter(p => 
            p._id !== product._id && 
            p.category?.main?.toString() === product.category?.main?.toString()
          )
          .sort(() => 0.5 - Math.random())
          .slice(0, 5);
        
        for (const related of relatedProducts) {
          await redisService.trackRelatedPurchase(product, related);
        }
      } catch (error) {
        console.error(`Error generating related products for ${product._id}:`, error);
      }
    }

    // Create chat conversations and messages
    console.log('💬 Creating chat conversations...');
    const deliveredOrders = await Order.find({ status: 'delivered' }).populate('items.productId userId');
    
    for (const order of deliveredOrders.slice(0, 20)) { // Limit to 20 conversations
      try {
        for (const item of order.items) {
          const product = item.productId as any;
          if (!product?.vendorId) continue;
          
          const vendorDoc = vendorDocs.find((v: any) => v._id.equals(product.vendorId));
          if (!vendorDoc) continue;
          
          const vendor = vendors.find(v => v._id.equals(vendorDoc.userId));
          if (!vendor) continue;
          
          // Create chat between user and vendor
          const chat = await Chat.create({
            participants: [order.userId, vendor._id],
            productId: product._id,
            archivedBy: new Map(),
            lastMessageTime: new Date()
          });
          
          // Create 2-5 messages in conversation
          const messagesInChat = Math.floor(Math.random() * 4) + 2;
          const sampleMessages = [
            "Hi, I'm interested in this product. Can you tell me more about it?",
            "Hello! This product is in excellent condition and ships within 24 hours.",
            "What's the return policy?",
            "We offer 30-day returns with free shipping back.",
            "Great! I'll place an order.",
            "Thank you for your purchase! Your order is being processed.",
            "The product arrived and it's perfect! Thank you.",
            "Glad you're happy with it! Please leave a review if you can."
          ];
          
          for (let i = 0; i < messagesInChat; i++) {
            const isUserMessage = i % 2 === 0;
            const senderId = isUserMessage ? order.userId : vendor._id;
            const receiverId = isUserMessage ? vendor._id : order.userId;
            
            await Message.create({
              chatId: chat._id,
              senderId,
              receiverId,
              text: sampleMessages[i % sampleMessages.length],
              read: Math.random() > 0.3 // 70% chance message is read
            });
          }
          
          // Update chat's last message time
          await Chat.findByIdAndUpdate(chat._id, {
            lastMessageTime: new Date()
          });
          
          messageCount += messagesInChat;
          break; // Only create one chat per order
        }
      } catch (error) {
        console.error('Error creating chat:', error);
      }
    }

    console.log(`\nSeeding completed successfully!`);
    console.log(`Created ${cartCount} carts, ${wishlistCount} wishlists, ${orderCount} orders, ${messageCount} messages`);
    console.log(`Generated analytics data for ${products.length} products`);
    
  } catch (error) {
    console.error('Error in seedInteractions:', error);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB');
    }
  }
}

if (require.main === module) {
  seedInteractions();
}

export default seedInteractions;