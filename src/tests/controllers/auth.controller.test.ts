import request from 'supertest';
import express from 'express';
import { login, signup, verifyController, requestPasswordChange, changePassword } from '../../controllers/auth.controller';
import User from '../../models/user.model';

const app = express();
app.use(express.json());
app.post('/register', signup);
app.post('/login', login);
app.post('/verify-email', verifyController);
app.post('/forgot-password', requestPasswordChange);
app.post('/reset-password', changePassword);

describe('Auth Controller', () => {
  describe('POST /register', () => {
    it('should register a new user', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'user'
      };

      const response = await request(app)
        .post('/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('registered successfully');
    });

    it('should return error for duplicate email', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'user'
      };

      await User.create(userData);

      const response = await request(app)
        .post('/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /login', () => {
    beforeEach(async () => {
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed-password',
        role: 'user',
        isEmailVerified: true
      });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
    });

    it('should return error for invalid credentials', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});