import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// Mock Redis for tests
jest.mock('../services/redis.service', () => ({
  default: jest.fn().mockImplementation(() => ({
    trackEvent: jest.fn(),
    getProductWithCache: jest.fn(),
    invalidateProductCache: jest.fn(),
    addToCart: jest.fn(),
    getCart: jest.fn(),
    removeFromCart: jest.fn(),
    clearCart: jest.fn()
  }))
}));

// Mock JWT
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mock-token'),
  verify: jest.fn(() => ({ id: 'mock-user-id', role: 'user' }))
}));

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn(() => Promise.resolve('hashed-password')),
  compare: jest.fn(() => Promise.resolve(true))
}));