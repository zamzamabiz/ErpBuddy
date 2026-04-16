const asyncHandler = require('@utils/asyncHandler');
const AuthService = require('./auth.service');

const User = require('../users/user.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, role, company } = req.body;
  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(400).json({ success: false, message: 'Email already registered' });
  }
  const user = await User.create({ name, email, password, role, company });
  res.status(201).json({ success: true, user: { _id: user._id, name: user.name, email: user.email, role: user.role, company: user.company, isActive: user.isActive, createdAt: user.createdAt } });
});

exports.login = asyncHandler(async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }
  
  try {
    const result = await AuthService.login({ email });
    // apiResponse returns a string, parse it
    const responseData = typeof result === 'string' ? JSON.parse(result) : result;
    
    // Map accessToken to token for frontend compatibility
    if (responseData.data && responseData.data.accessToken) {
      responseData.token = responseData.data.accessToken;
      responseData.user = responseData.data.user;
    }
    
    res.json(responseData);
  } catch (err) {
    return res.status(401).json({ success: false, message: err.message || 'Login failed' });
  }
});

exports.me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  res.json({ success: true, user: { _id: user._id, name: user.name, email: user.email, role: user.role, company: user.company, isActive: user.isActive, createdAt: user.createdAt } });
});
