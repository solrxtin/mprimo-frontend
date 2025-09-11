import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import User from '../../models/user.model';
import bcrypt from 'bcrypt';

describe('Auth Controller', () => {
  let mongoServer: MongoMemoryServer;
  let app: any;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    app = require('../../index').default;
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    test('should register a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        role: 'personal',
        profile: {
          firstName: 'John',
          lastName: 'Doe'
        }
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.token).toBeDefined();
    });

    test('should not register user with existing email', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        role: 'personal',
        profile: { firstName: 'John', lastName: 'Doe' }
      };

      await User.create({
        ...userData,
        password: await bcrypt.hash(userData.password, 10)
      });

      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);
    });
  });

  describe('POST /api/auth/login', () => {
    test('should login with valid credentials', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        role: 'personal',
        profile: { firstName: 'John', lastName: 'Doe' }
      };

      await User.create({
        ...userData,
        password: await bcrypt.hash(userData.password, 10)
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
    });

    test('should not login with invalid credentials', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword'
        })
        .expect(401);
    });
  });
});