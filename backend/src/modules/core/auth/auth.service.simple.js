const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../users/user.model');
const jwtConfig = require('../../../config/jwt.config');

const JWT_SECRET = jwtConfig.secret;
const JWT_EXPIRE = jwtConfig.expiresIn || '7d';

/**
 * Register a new user
 * @param {Object} data - { name, email, password, tenantId, role }
 * @returns {Object} User object (without password)
 */
async function registerUser(data) {
  const { name, email, password, tenantId, role } = data;

  // Validate input
  if (!name || !email || !password || !tenantId || !role) {
    throw new Error('Name, email, password, tenantId, and role are required');
  }

  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error('Email already registered');
  }

  // Note: password will be hashed by the schema pre-save hook
  const user = await User.create({
    name,
    email,
    password,
    tenantId,
    role,
    company: 'Default'  // Default company value
  });

  // Return user without password
  const userObj = user.toObject();
  delete userObj.password;
  return userObj;
}

/**
 * Login user and generate JWT token
 * @param {Object} data - { email, password }
 * @returns {Object} { user, token }
 */
async function loginUser(data) {
  const { email, password } = data;

  // Validate input
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  // Find user
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Compare password using the schema method
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new Error('Invalid email or password');
  }

  // Generate JWT token with multi-tenant support and role
  const payload = {
    userId: user._id.toString(),
    email: user.email,
    tenantId: user.tenantId.toString(),
    companyId: user.tenantId.toString(),  // For compatibility
    userRole: user.userRole  // Add role to JWT
  };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRE });

  // Return user (without password) and token
  const userObj = user.toObject();
  delete userObj.password;
  return { user: userObj, token };
}

module.exports = {
  registerUser,
  loginUser
};
