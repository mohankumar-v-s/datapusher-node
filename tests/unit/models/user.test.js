const { Sequelize } = require('sequelize');
const User = require('../../../src/models/user.model');

describe('User Model', () => {
  let sequelize;
  let UserModel;

  beforeAll(async () => {
    sequelize = new Sequelize('sqlite::memory:', { logging: false });
    UserModel = User(sequelize);
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await UserModel.destroy({ where: {} });
  });

  describe('Model Definition', () => {
    it('should have the correct table name', () => {
      expect(UserModel.tableName).toBe('Users');
    });

    it('should have the required fields', () => {
      const attributes = Object.keys(UserModel.rawAttributes);
      expect(attributes).toContain('id');
      expect(attributes).toContain('email');
      expect(attributes).toContain('password');
      expect(attributes).toContain('created_by');
      expect(attributes).toContain('updated_by');
    });
  });

  describe('User Creation', () => {
    it('should create a user with required fields', async () => {
      const user = await UserModel.create({
        email: 'test@example.com',
        password: 'password123'
      });

      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.email).toBe('test@example.com');
      expect(user.password).toBe('password123');
    });

    it('should not create a user without required fields', async () => {
      await expect(UserModel.create({
        email: 'test@example.com'
      })).rejects.toThrow();

      await expect(UserModel.create({
        password: 'password123'
      })).rejects.toThrow();
    });

    it('should not create a user with invalid email', async () => {
      await expect(UserModel.create({
        email: 'invalid-email',
        password: 'password123'
      })).rejects.toThrow();
    });

    it('should not create a user with duplicate email', async () => {
      await UserModel.create({
        email: 'test@example.com',
        password: 'password123'
      });

      await expect(UserModel.create({
        email: 'test@example.com',
        password: 'password456'
      })).rejects.toThrow();
    });
  });

  describe('User Updates', () => {
    it('should update user fields', async () => {
      const user = await UserModel.create({
        email: 'test@example.com',
        password: 'password123'
      });

      await user.update({
        email: 'updated@example.com',
        password: 'newpassword123'
      });

      const updatedUser = await UserModel.findByPk(user.id);
      expect(updatedUser.email).toBe('updated@example.com');
      expect(updatedUser.password).toBe('newpassword123');
    });

    it('should not update to duplicate email', async () => {
      await UserModel.create({
        email: 'existing@example.com',
        password: 'password123'
      });

      const user = await UserModel.create({
        email: 'test@example.com',
        password: 'password123'
      });

      await expect(user.update({
        email: 'existing@example.com'
      })).rejects.toThrow();
    });
  });

  describe('User Deletion', () => {
    it('should delete a user', async () => {
      const user = await UserModel.create({
        email: 'test@example.com',
        password: 'password123'
      });

      await user.destroy();
      const deletedUser = await UserModel.findByPk(user.id);
      expect(deletedUser).toBeNull();
    });
  });
}); 