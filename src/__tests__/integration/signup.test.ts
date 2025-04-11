
import request from 'supertest';
import app from '../../index'; 
import User from '../../models/user.model';
import bcrypt from 'bcrypt';


describe('Integration: POST /api/v1/auth/register', () => {
    const endpoint = '/api/v1/auth/register';
  
    const validUser = {
      email: 'integration@example.com',
      password: 'SecurePass123!',
      firstName: 'Jane',
      lastName: 'Doe',
      phoneNumber: '+15551234567'
    };
  
    it('should create a new user with hashed password and default values', async () => {
      const res = await request(app).post(endpoint).send(validUser);
  
      expect(res.status).toBe(201);
      expect(res.body.message).toBe('User created successfully');
      expect(res.body.user).toBeDefined();
      expect(res.body.user.password).toBeUndefined();
      expect(res.body.user.email).toBe(validUser.email);
      expect(res.body.user.profile.firstName).toBe(validUser.firstName);
  
      const userInDb = await User.findOne({ email: validUser.email });
      expect(userInDb).toBeTruthy();
      if (userInDb) {
        const passwordMatches = await bcrypt.compare(validUser.password, userInDb.password!);
        expect(passwordMatches).toBe(true);
      }
      expect(userInDb!.role).toBe('customer');
      expect(userInDb!.preferences.language).toBe('en');
    });
  
    it('should not allow duplicate registration', async () => {
      await request(app).post(endpoint).send(validUser);
      const res = await request(app).post(endpoint).send(validUser);
  
      expect(res.status).toBe(409);
      expect(res.body.message).toBe('Email already registered');
    });
  
    it('should return 400 if required fields are missing', async () => {
      const res = await request(app).post(endpoint).send({});
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/required/);
    });
});