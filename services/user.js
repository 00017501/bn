const bcrypt = require('bcrypt');
const { 
  Sources, 
  readSource, 
  writeToSource, 
  generateUniqueIdForSource 
} = require('../data/utils');

// Service that handles different user related oprations
const userService = {
  /**
   * Get all users
   * @returns {Array} Array of users
   */
  list() {
    const users = readSource(Sources.USERS);

    // Remove password hashes before returning
    return users.map(user => {
      const { password_hash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  },

  /**
   * Get a user by ID
   * @param {number} id - ID of the user
   * @returns {Object|null} User object or null if not found
   */
  getById(id) {
    const users = readSource(Sources.USERS);
    const user = users.find(item => item.id === id);
    
    if (!user) return null;
    
    // Remove password hash before returning
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  /**
   * Create a new user
   * @param {Object} data - User data
   * @param {string} data.username - Username
   * @param {string} data.email - Email address
   * @param {string} data.password - Plain text password
   * @returns {Object} Created user
   */
  async create(data) {
    const users = readSource(Sources.USERS);
    
    // Check if username or email already exists
    const existingUser = users.find(item => 
      item.username === data.username || item.email === data.email
    );

    if (existingUser) {
      if (existingUser.username === data.username) {
        throw new Error('Username already taken');
      }
      throw new Error('Email already registered');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(data.password, salt);

    // Generate unique UUID for the new user
    const id = generateUniqueIdForSource(Sources.USERS);

    const newUser = {
      id,
      username: data.username,
      email: data.email,
      fullName: data.fullName || '',
      password_hash,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Save user to data source
    users.push(newUser);
    writeToSource(Sources.USERS, users);

    // Remove password hash before returning
    const { password_hash: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  },

  /**
   * Get a user with password hash (for authentication)
   * @param {string} username - Username or email
   * @returns {Object|null} User object with password hash or null if not found
   */
  _getUserForAuth(username) {
    const users = readSource(Sources.USERS);
    // Find by username or email
    return users.find(item => 
      (item.username === username || item.email === username) && 
        (item.is_active === undefined || item.is_active === true)
    );
  },

  /**
   * Authenticate a user
   * @param {string} username - Username or email
   * @param {string} password - Password
   * @returns {Object|null} User data if authentication successful, null otherwise
   */
  async authenticate(username, password) {
    if (!username || !password) {
      throw new Error('Username and password are required');
    }

    try {
      const user = this._getUserForAuth(username);

      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Verify the password with a timeout for security reasons
      // This is to prevent timing attacks, including DoS, and to make sure consistent time is taken
      let isMatch;
      try {
        isMatch = await Promise.race([
          bcrypt.compare(password, user.password_hash),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Authentication timeout')), 5000)
          )
        ]);
      } catch (compareError) {
        console.error('Password comparison error:', compareError.name);
        throw new Error('Authentication service issue');
      }

      if (!isMatch) {
        throw new Error('Invalid credentials');
      }

      // Return user data without sensitive fields
      const { password_hash, ...userWithoutPassword } = user;

      return userWithoutPassword;
    } catch (error) {
      // Just log the error and rethrow
      console.error(`Authentication error: ${error || 'Unknown'}`);

      throw error;
    }
  },
};

module.exports = userService;