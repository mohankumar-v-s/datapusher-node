const { userSchema, changePasswordSchema, accountSchema, accountUpdateSchema, destinationSchema, destinationUpdateSchema } = require('../../../src/utils/validationSchema');

describe('Validation Schemas', () => {
  describe('userSchema', () => {
    it('should validate correct user data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123'
      };
      const { error } = userSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123'
      };
      const { error } = userSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('email');
    });

    it('should reject short password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '12345'
      };
      const { error } = userSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('password');
    });
  });

  describe('changePasswordSchema', () => {
    it('should validate correct password change data', () => {
      const validData = {
        email: 'test@example.com',
        currentPassword: 'oldpass123',
        newPassword: 'newpass123'
      };
      const { error } = changePasswordSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should reject when new password is same as current', () => {
      const invalidData = {
        email: 'test@example.com',
        currentPassword: 'samepass123',
        newPassword: 'samepass123'
      };
      const { error } = changePasswordSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('different from current password');
    });
  });

  describe('accountSchema', () => {
    it('should validate correct account data', () => {
      const validData = {
        account_name: 'Test Account',
        website: 'https://test.com'
      };
      const { error } = accountSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should validate account without website', () => {
      const validData = {
        account_name: 'Test Account'
      };
      const { error } = accountSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should reject invalid website URL', () => {
      const invalidData = {
        account_name: 'Test Account',
        website: 'invalid-url'
      };
      const { error } = accountSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('website');
    });
  });

  describe('destinationSchema', () => {
    it('should validate correct destination data', () => {
      const validData = {
        url: 'https://webhook.site/123',
        http_method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      };
      const { error } = destinationSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should reject invalid HTTP method', () => {
      const invalidData = {
        url: 'https://webhook.site/123',
        http_method: 'INVALID',
        headers: { 'Content-Type': 'application/json' }
      };
      const { error } = destinationSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('http_method');
    });

    it('should reject invalid URL', () => {
      const invalidData = {
        url: 'invalid-url',
        http_method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      };
      const { error } = destinationSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('url');
    });
  });
}); 