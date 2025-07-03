import mongoose from 'mongoose';
import connectDb from '../config/connectDb';

async function createIndexes() {
  try {
    await connectDb();
    
    const db = mongoose.connection.db;
    
    if (db) {
      // Chat indexes
    await db.collection('chats').createIndex({ participants: 1 });
    await db.collection('chats').createIndex({ productId: 1 });
    await db.collection('chats').createIndex({ lastMessageTime: -1 });
    
    // Message indexes
    await db.collection('messages').createIndex({ chatId: 1, createdAt: -1 });
    await db.collection('messages').createIndex({ receiverId: 1, read: 1 });
    
    // Product indexes
    await db.collection('products').createIndex({ category: 1, status: 1 });
    await db.collection('products').createIndex({ vendorId: 1 });
    await db.collection('products').createIndex({ 'location.country': 1 });
    
    // Order indexes
    await db.collection('orders').createIndex({ userId: 1, status: 1 });
    await db.collection('orders').createIndex({ vendorId: 1, status: 1 });
    
    // Crypto wallet indexes
    await db.collection('cryptowallets').createIndex({ userId: 1 }, { unique: true });
    await db.collection('cryptowallets').createIndex({ address: 1 }, { unique: true });
    
    console.log('All indexes created successfully');
    process.exit(0);
    }
  } catch (error) {
    console.error('Error creating indexes:', error);
    process.exit(1);
  }
}

createIndexes();