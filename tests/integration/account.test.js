const request = require('supertest');
const app = require('../../index');
const { Account, AccountMember, User } = require('../../src/models');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

describe('Account API', () => {
  let authToken;
  let testUser;

  beforeAll(async () => {
    // Create a test user with hashed password
    const hashedPassword = await bcrypt.hash('password123', 10);
    testUser = await User.create({
      email: 'accounttest@example.com',
      password: hashedPassword
    });

    // Login to get token
    const loginResponse = await request(app)
      .post('/api/user/login')
      .send({
        email: 'accounttest@example.com',
        password: 'password123'
      });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.success).toBe(true);
    expect(loginResponse.body.token).toBeTruthy();
    
    authToken = loginResponse.body.token;
  });

  beforeEach(async () => {
    // Delete related records first
    await AccountMember.destroy({ where: {} });
    await Account.destroy({ where: {} });
  });

  afterAll(async () => {
    // Clean up test user
    await AccountMember.destroy({ where: {} });
    await Account.destroy({ where: {} });
    await User.destroy({ where: {} });
  });

  describe('POST /accounts', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/accounts')
        .send({
          account_name: 'Test Account',
          website: 'https://test.com'
        });

      expect(response.status).toBe(401);
    });

    it('should create a new account', async () => {
      const response = await request(app)
        .post('/api/accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          account_name: 'Test Account',
          website: 'https://test.com'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.account).toHaveProperty('id');
      expect(response.body.data.account.account_name).toBe('Test Account');
      expect(response.body.data.accountMembers).toBeDefined();
    });
  });

  describe('GET /accounts', () => {
    it('should list all accounts for authenticated user', async () => {
      // Create a test account first
      const account = await Account.create({
        account_name: 'Test Account',
        website: 'https://test.com',
        created_by: testUser.id,
        updated_by: testUser.id
      });

      await AccountMember.create({
        account_id: account.id,
        user_id: testUser.id,
        role_id: 1,
        created_by: testUser.id,
        updated_by: testUser.id
      });

      const response = await request(app)
        .get('/api/accounts')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('id');
    });
  });
});