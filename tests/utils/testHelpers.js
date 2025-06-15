const jwt = require('jsonwebtoken');
require('dotenv').config();

const generateTestToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

module.exports = {
  generateTestToken
};