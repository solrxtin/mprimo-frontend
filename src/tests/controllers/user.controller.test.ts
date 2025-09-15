import request from 'supertest';
import express from 'express';
import { addAddress, modifyAddress, deleteAddress, getUserProfile, getUserOrders } from '../../controllers/user.controller';
import User from '../../models/user.model';

// Extend Request interface to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  (req as any).userId = 'mock-user-id';
  req.user = { id: 'mock-user-id', role: 'user' };
  next();
});

app.get('/profile', getUserProfile);
app.post('/addresses', addAddress);
app.put('/addresses/:id', modifyAddress);
app.delete('/addresses/:id', deleteAddress);
app.get('/orders', getUserOrders);

describe('User Controller', () => {
  let userId: string;

  beforeEach(async () => {
    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashed-password',
      role: 'user',
      isEmailVerified: true
    });
    userId = user._id.toString();
    
    // Mock req.user.id to match created user
    app.use((req, res, next) => {
      req.user = { id: userId, role: 'user' };
      next();
    });
  });

  describe('GET /profile', () => {
    it('should get user profile', async () => {
      const response = await request(app)
        .get('/profile')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user.email).toBe('test@example.com');
    });
  });

  describe('GET /orders', () => {
    it('should get user orders', async () => {
      const response = await request(app)
        .get('/orders')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /addresses', () => {
    it('should add new address', async () => {
      const addressData = {
        address: {
          type: 'shipping',
          street: '123 Main St',
          city: 'Test City',
          state: 'Test State',
          postalCode: '12345',
          country: 'Test Country'
        }
      };

      const response = await request(app)
        .post('/addresses')
        .send(addressData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Address added successfully');
    });
  });

  describe('DELETE /addresses/:id', () => {
    it('should delete address', async () => {
      // First add an address
      await User.findByIdAndUpdate(userId, {
        $push: {
          addresses: {
            _id: 'mock-address-id',
            type: 'billing',
            street: '123 Main St',
            city: 'Test City',
            state: 'Test State',
            postalCode: '12345',
            country: 'Test Country',
            isDefault: false
          }
        }
      });

      const response = await request(app)
        .delete('/addresses/mock-address-id')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Address deleted successfully');
    });
  });
});