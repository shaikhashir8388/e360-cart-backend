const jwt = require('jsonwebtoken');

/**
 * Generate JWT token
 * @param {Object} payload - User data to encode in token
 * @returns {String} JWT token
 */
const generateToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'fallback-secret-key',
    {
      expiresIn: process.env.JWT_EXPIRE || '7d',
      issuer: 'shophub-api',
      audience: 'shophub-client'
    }
  );
};

/**
 * Verify JWT token
 * @param {String} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token) => {
  return jwt.verify(
    token,
    process.env.JWT_SECRET || 'fallback-secret-key',
    {
      issuer: 'shophub-api',
      audience: 'shophub-client'
    }
  );
};

/**
 * Generate refresh token (longer expiry)
 * @param {Object} payload - User data to encode in token
 * @returns {String} Refresh token
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'fallback-secret-key',
    {
      expiresIn: '30d',
      issuer: 'shophub-api',
      audience: 'shophub-client'
    }
  );
};

module.exports = {
  generateToken,
  verifyToken,
  generateRefreshToken
};
