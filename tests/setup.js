process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';

console.log('Test environment setup:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('JWT_SECRET:', process.env.JWT_SECRET);

const { sequelize } = require('../src/models');
const { Role } = require('../src/models');

beforeAll(async () => {
  try {
    // Sync database and create test roles
    await sequelize.sync({ force: true });
    console.log('Database synchronized successfully');
    
    await Role.bulkCreate([
      { role_name: 'Admin' },
      { role_name: 'User' }
    ]);
    console.log('Test roles created successfully');
  } catch (error) {
    console.error('Error in test setup:', error);
    throw error;
  }
});

afterAll(async () => {
  try {
    await sequelize.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error closing database connection:', error);
    throw error;
  }
});