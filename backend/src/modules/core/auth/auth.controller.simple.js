const { registerUser, loginUser } = require('./auth.service.simple');

/**
 * POST /api/auth/register
 * Register a new user
 */
async function register(req, res) {
  try {
    const { name, email, password, companyId } = req.body;
    const user = await registerUser({ name, email, password, companyId });
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: user
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
}

/**
 * POST /api/auth/login
 * Login user and return JWT token
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;
    const result = await loginUser({ email, password });
    res.json({
      success: true,
      message: 'Login successful',
      data: result
    });
  } catch (err) {
    res.status(401).json({
      success: false,
      error: err.message
    });
  }
}

module.exports = {
  register,
  login
};
