const { Sequelize } = require('sequelize');
const Account = require('../../../src/models/account.model');
const User = require('../../../src/models/user.model');

describe('Account Model', () => {
  let sequelize;
  let AccountModel;
  let UserModel;

  beforeAll(async () => {
    sequelize = new Sequelize('sqlite::memory:', { logging: false });
    AccountModel = Account(sequelize);
    UserModel = User(sequelize);

    // Set up associations
    AccountModel.belongsTo(UserModel, { foreignKey: 'created_by', as: 'creator' });
    AccountModel.belongsTo(UserModel, { foreignKey: 'updated_by', as: 'updater' });
    UserModel.hasMany(AccountModel, { foreignKey: 'created_by', as: 'createdAccounts' });
    UserModel.hasMany(AccountModel, { foreignKey: 'updated_by', as: 'updatedAccounts' });

    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await AccountModel.destroy({ where: {} });
    await UserModel.destroy({ where: {} });
  });

  describe('Model Definition', () => {
    it('should have the correct table name', () => {
      expect(AccountModel.tableName).toBe('Accounts');
    });

    it('should have the required fields', () => {
      const attributes = Object.keys(AccountModel.rawAttributes);
      expect(attributes).toContain('id');
      expect(attributes).toContain('account_name');
      expect(attributes).toContain('app_secret_token');
      expect(attributes).toContain('website');
      expect(attributes).toContain('created_by');
      expect(attributes).toContain('updated_by');
    });
  });

  describe('Account Creation', () => {
    it('should create an account with required fields', async () => {
      // Create a test user first
      const user = await UserModel.create({
        email: 'test@example.com',
        password: 'password123'
      });

      const account = await AccountModel.create({
        account_name: 'Test Account',
        website: 'https://test.com',
        created_by: user.id,
        updated_by: user.id
      });

      expect(account).toBeDefined();
      expect(account.id).toBeDefined();
      expect(account.account_name).toBe('Test Account');
      expect(account.website).toBe('https://test.com');
      expect(account.app_secret_token).toBeDefined();
    });

    it('should not create an account without required fields', async () => {
      await expect(AccountModel.create({
        website: 'https://test.com'
      })).rejects.toThrow();
    });

    it('should generate unique id and app_secret_token', async () => {
      const user = await UserModel.create({
        email: 'test@example.com',
        password: 'password123'
      });

      const account1 = await AccountModel.create({
        account_name: 'Test Account 1',
        created_by: user.id,
        updated_by: user.id
      });

      const account2 = await AccountModel.create({
        account_name: 'Test Account 2',
        created_by: user.id,
        updated_by: user.id
      });

      expect(account1.id).not.toBe(account2.id);
      expect(account1.app_secret_token).not.toBe(account2.app_secret_token);
    });
  });

  describe('Associations', () => {
    it('should have correct associations with User model', async () => {
      const user = await UserModel.create({
        email: 'test@example.com',
        password: 'password123'
      });

      const account = await AccountModel.create({
        account_name: 'Test Account',
        created_by: user.id,
        updated_by: user.id
      });

      const creator = await account.getCreator();
      const updater = await account.getUpdater();

      expect(creator).toBeDefined();
      expect(creator.id).toBe(user.id);
      expect(updater).toBeDefined();
      expect(updater.id).toBe(user.id);
    });
  });
}); 