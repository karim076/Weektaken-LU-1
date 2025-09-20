const { describe, test, expect, beforeEach, afterEach } = require('@jest/globals');
const AuthService = require('../../src/services/AuthService');
const UserDAO = require('../../src/dao/UserDAO');
const JWTService = require('../../src/services/JWTService');
const bcrypt = require('bcryptjs');

// Mock dependencies (vergelijkbaar met Mock in C# MSTest)
jest.mock('../../src/dao/UserDAO');
jest.mock('../../src/services/JWTService');
jest.mock('bcryptjs');

describe('AuthService', () => {
  let authService;
  let mockUserDAO;
  let mockJWTService;

  beforeEach(() => {
    // Setup - vergelijkbaar met [TestInitialize] in MSTest
    jest.clearAllMocks();
    
    mockUserDAO = new UserDAO();
    mockJWTService = new JWTService();
    authService = new AuthService();
    authService.userDAO = mockUserDAO;
    authService.jwtService = mockJWTService;
  });

  afterEach(() => {
    // Cleanup - vergelijkbaar met [TestCleanup] in MSTest
    jest.resetAllMocks();
  });

  describe('authenticateUser', () => {
    test('should authenticate user with valid username and password', async () => {
      // Arrange - vergelijkbaar met AAA pattern in MSTest
      const username = 'testuser';
      const password = 'testpassword';
      const hashedPassword = 'hashedpassword123';
      const mockUser = {
        user_id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: hashedPassword,
        user_type: 'customer',
        first_name: 'Test',
        last_name: 'User'
      };
      const expectedToken = 'jwt.token.here';

      mockUserDAO.findByUsername.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      mockJWTService.generateCustomerToken.mockReturnValue(expectedToken);

      // Act
      const result = await authService.authenticateUser(username, password);

      // Assert
      expect(result.success).toBe(true);
      expect(result.user.username).toBe('testuser');
      expect(result.user.role).toBe('customer');
      expect(result.token).toBe(expectedToken);
      expect(result.user.password).toBeUndefined(); // Password should be removed
      expect(mockUserDAO.findByUsername).toHaveBeenCalledWith(username);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
    });

    test('should authenticate user with valid email and password', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'testpassword';
      const hashedPassword = 'hashedpassword123';
      const mockUser = {
        user_id: 1,
        username: 'testuser',
        email: email,
        password: hashedPassword,
        user_type: 'customer'
      };

      mockUserDAO.findByUsername.mockResolvedValue(null);
      mockUserDAO.findByEmail.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      mockJWTService.generateCustomerToken.mockReturnValue('token');

      // Act
      const result = await authService.authenticateUser(email, password);

      // Assert
      expect(result.success).toBe(true);
      expect(mockUserDAO.findByUsername).toHaveBeenCalledWith(email);
      expect(mockUserDAO.findByEmail).toHaveBeenCalledWith(email);
    });

    test('should handle Mike as admin user', async () => {
      // Arrange
      const mockMike = {
        user_id: 1,
        username: 'Mike',
        email: 'mike@sakila.com',
        password: 'hashedpassword',
        user_type: 'staff'
      };

      mockUserDAO.findByUsername.mockResolvedValue(mockMike);
      bcrypt.compare.mockResolvedValue(true);
      mockJWTService.generateStaffToken.mockReturnValue('admin-token');

      // Act
      const result = await authService.authenticateUser('Mike', 'password');

      // Assert
      expect(result.success).toBe(true);
      expect(result.user.role).toBe('admin');
      expect(mockJWTService.generateStaffToken).toHaveBeenCalled();
    });

    test('should return error for non-existent user', async () => {
      // Arrange
      mockUserDAO.findByUsername.mockResolvedValue(null);
      mockUserDAO.findByEmail.mockResolvedValue(null);

      // Act
      const result = await authService.authenticateUser('nonexistent', 'password');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Ongeldige gebruikersnaam/email of wachtwoord');
    });

    test('should return error for invalid password', async () => {
      // Arrange
      const mockUser = {
        user_id: 1,
        username: 'testuser',
        password: 'hashedpassword',
        user_type: 'customer'
      };

      mockUserDAO.findByUsername.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      // Act
      const result = await authService.authenticateUser('testuser', 'wrongpassword');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Ongeldige gebruikersnaam/email of wachtwoord');
    });

    test('should handle database errors gracefully', async () => {
      // Arrange
      mockUserDAO.findByUsername.mockRejectedValue(new Error('Database connection failed'));

      // Act
      const result = await authService.authenticateUser('testuser', 'password');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Authenticatie mislukt');
    });

    // test('should handle token generation errors', async () => {
    //   // Arrange
    //   const mockUser = {
    //     user_id: 1,
    //     username: 'testuser',
    //     password: 'hashedpassword',
    //     user_type: 'customer'
    //   };

    //   mockUserDAO.findByUsername.mockResolvedValue(mockUser);
    //   bcrypt.compare.mockResolvedValue(true);
    //   mockJWTService.generateCustomerToken.mockImplementation(() => {
    //     throw new Error('Token generation failed');
    //   });

    //   // Act
    //   const result = await authService.authenticateUser('testuser', 'password');

    //   // Assert
    //   expect(result.success).toBe(false);
    //   expect(result.error).toBe('Er is een fout opgetreden bij het inloggen');
    // });
  });

  // describe('verifyPassword', () => {
  //   test('should return true for valid password', async () => {
  //     // Arrange
  //     bcrypt.compare.mockResolvedValue(true);

  //     // Act
  //     const result = await authService.verifyPassword('plaintext', 'hashed');

  //     // Assert
  //     expect(result).toBe(true);
  //     expect(bcrypt.compare).toHaveBeenCalledWith('plaintext', 'hashed');
  //   });

  //   test('should return false for invalid password', async () => {
  //     // Arrange
  //     bcrypt.compare.mockResolvedValue(false);

  //     // Act
  //     const result = await authService.verifyPassword('plaintext', 'hashed');

  //     // Assert
  //     expect(result).toBe(false);
  //   });

  //   test('should return false on bcrypt error', async () => {
  //     // Arrange
  //     bcrypt.compare.mockRejectedValue(new Error('Bcrypt error'));

  //     // Act
  //     const result = await authService.verifyPassword('plaintext', 'hashed');

  //     // Assert
  //     expect(result).toBe(false);
  //   });
  // });

  // describe('hashPassword', () => {
  //   test('should hash password successfully', async () => {
  //     // Arrange
  //     const plainPassword = 'testpassword';
  //     const hashedPassword = 'hashed123';
  //     bcrypt.hash.mockResolvedValue(hashedPassword);

  //     // Act
  //     const result = await authService.hashPassword(plainPassword);

  //     // Assert
  //     expect(result).toBe(hashedPassword);
  //     expect(bcrypt.hash).toHaveBeenCalledWith(plainPassword, 12);
  //   });

  //   test('should throw error when hashing fails', async () => {
  //     // Arrange
  //     bcrypt.hash.mockRejectedValue(new Error('Hashing failed'));

  //     // Act & Assert
  //     await expect(authService.hashPassword('password')).rejects.toThrow('Password hashing failed');
  //   });
  // });

  describe('registerCustomer', () => {
    test('should register new customer successfully', async () => {
      // Arrange
      const userData = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'plainpassword',
        first_name: 'New',
        last_name: 'User'
      };
      const hashedPassword = 'hashed123';

      mockUserDAO.findByUsername.mockResolvedValue(null);
      mockUserDAO.findByEmail.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue(hashedPassword);
      mockUserDAO.createCustomer.mockResolvedValue({
        success: true,
        customer_id: 1
      });

      // Act
      const result = await authService.registerCustomer(userData);

      // Assert
      expect(result.success).toBe(true);
      expect(mockUserDAO.createCustomer).toHaveBeenCalledWith({
        ...userData,
        password: hashedPassword,
        active: true
      });
    });

    test('should reject registration for existing username', async () => {
      // Arrange
      const userData = { username: 'existinguser', email: 'test@example.com' };
      mockUserDAO.findByUsername.mockResolvedValue({ username: 'existinguser' });

      // Act
      const result = await authService.registerCustomer(userData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Username already exists');
    });

    test('should reject registration for existing email', async () => {
      // Arrange
      const userData = { username: 'newuser', email: 'existing@example.com' };
      mockUserDAO.findByUsername.mockResolvedValue(null);
      mockUserDAO.findByEmail.mockResolvedValue({ email: 'existing@example.com' });

      // Act
      const result = await authService.registerCustomer(userData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Email already exists');
    });
  });
});
