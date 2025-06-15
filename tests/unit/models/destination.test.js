const { Sequelize } = require('sequelize');
const Destination = require('../../../src/models/destination.model');
const User = require('../../../src/models/user.model');
const Account = require('../../../src/models/account.model');

describe('Destination Model', () => {
  let sequelize;
  let DestinationModel;
  let UserModel;
  let AccountModel;

  beforeAll(async () => {
    sequelize = new Sequelize('sqlite::memory:', { logging: false });
    DestinationModel = Destination(sequelize);
    UserModel = User(sequelize);
    AccountModel = Account(sequelize);

    // Set up associations
    DestinationModel.belongsTo(AccountModel, { foreignKey: 'account_id', targetKey: 'id', as: 'account' });
    AccountModel.hasMany(DestinationModel, { foreignKey: 'account_id', sourceKey: 'id', as: 'destinations' });
    DestinationModel.belongsTo(UserModel, { foreignKey: 'created_by', as: 'creator' });
    DestinationModel.belongsTo(UserModel, { foreignKey: 'updated_by', as: 'updater' });

    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await DestinationModel.destroy({ where: {} });
    await AccountModel.destroy({ where: {} });
    await UserModel.destroy({ where: {} });
  });

  describe('Model Definition', () => {
    it('should have the correct table name', () => {
      expect(DestinationModel.tableName).toBe('Destinations');
    });

    it('should have the required fields', () => {
      const attributes = Object.keys(DestinationModel.rawAttributes);
      expect(attributes).toContain('id');
      expect(attributes).toContain('url');
      expect(attributes).toContain('method');
      expect(attributes).toContain('headers');
      expect(attributes).toContain('created_by');
      expect(attributes).toContain('updated_by');
    });
  });

  describe('Destination Creation', () => {
    let user;
    let account;

    beforeEach(async () => {
      user = await UserModel.create({
        email: 'test@example.com',
        password: 'password123'
      });

      account = await AccountModel.create({
        account_name: 'Test Account',
        created_by: user.id,
        updated_by: user.id
      });
    });

    it('should create a destination with required fields', async () => {
      const destination = await DestinationModel.create({
        url: 'https://webhook.site/123',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        account_id: account.id,
        created_by: user.id,
        updated_by: user.id
      });

      expect(destination).toBeDefined();
      expect(destination.id).toBeDefined();
      expect(destination.url).toBe('https://webhook.site/123');
      expect(destination.method).toBe('POST');
      expect(destination.headers).toEqual({ 'Content-Type': 'application/json' });
    });

    it('should not create a destination without required fields', async () => {
      await expect(DestinationModel.create({
        url: 'https://webhook.site/123',
        method: 'POST'
      })).rejects.toThrow();
    });

    it('should not create a destination with invalid method', async () => {
      await expect(DestinationModel.create({
        url: 'https://webhook.site/123',
        method: 'INVALID',
        headers: { 'Content-Type': 'application/json' },
        account_id: account.id,
        created_by: user.id,
        updated_by: user.id
      })).rejects.toThrow();
    });

    it('should not create a destination with invalid URL', async () => {
      await expect(DestinationModel.create({
        url: 'invalid-url',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        account_id: account.id,
        created_by: user.id,
        updated_by: user.id
      })).rejects.toThrow();
    });
  });

  describe('Associations', () => {
    let user;
    let account;
    let destination;

    beforeEach(async () => {
      user = await UserModel.create({
        email: 'test@example.com',
        password: 'password123'
      });

      account = await AccountModel.create({
        account_name: 'Test Account',
        created_by: user.id,
        updated_by: user.id
      });

      destination = await DestinationModel.create({
        url: 'https://webhook.site/123',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        account_id: account.id,
        created_by: user.id,
        updated_by: user.id
      });
    });

    it('should have correct associations with Account model', async () => {
      const associatedAccount = await destination.getAccount();
      expect(associatedAccount).toBeDefined();
      expect(associatedAccount.id).toBe(account.id);
    });

    it('should have correct associations with User model', async () => {
      const creator = await destination.getCreator();
      const updater = await destination.getUpdater();

      expect(creator).toBeDefined();
      expect(creator.id).toBe(user.id);
      expect(updater).toBeDefined();
      expect(updater.id).toBe(user.id);
    });
  });
}); 