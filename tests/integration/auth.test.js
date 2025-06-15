const request = require('supertest');
const app = require('../../index');
const { User } = require('../../src/models');

describe('Authentication API', () => {
  const testUser = {
    email: 'test@example.com',
    password: 'password123'
  };

  beforeEach(async () => {
    await User.destroy({ where: {} });
  });

  describe('POST /api/user/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/user/register')
        .send(testUser);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(testUser.email);
    });

    it('should not register duplicate email', async () => {
      await request(app).post('/api/user/register').send(testUser);
      const response = await request(app)
        .post('/api/user/register')
        .send(testUser);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Email already exists');
    });
  });

  describe('POST /api/user/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/user/register').send(testUser);
    });

    it('should login successfully', async () => {
      const response = await request(app)
        .post('/api/user/login')
        .send(testUser);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeTruthy();
    });

    it('should not login with wrong password', async () => {
      const response = await request(app)
        .post('/api/user/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid credentials');
    });
  });
});