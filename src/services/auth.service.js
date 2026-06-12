const jwt = require('jsonwebtoken');
const { logger } = require('../utils/logger');

/**
 * Auth service handling JWT token validation.
 * BUG: Key rotation implementation is incomplete - new keys are used for signing
 * but old keys aren't kept for verification, causing signature mismatches.
 */
class AuthService {
  constructor() {
    this.currentKey = process.env.JWT_SECRET || 'default-secret-key-v2';
    this.previousKeys = []; // BUG: Previous keys not populated during rotation
  }

  /**
   * Sign token with current key.
   */
  signToken(payload) {
    return jwt.sign(payload, this.currentKey, {
      expiresIn: '24h',
      algorithm: 'HS256',
    });
  }

  /**
   * Validate token - BUG: Only validates against current key.
   * After key rotation, all existing tokens become invalid.
   */
  validateToken(token) {
    try {
      // BUG: Only tries current key, not previous keys
      // After rotation, all sessions with old tokens fail
      const decoded = jwt.verify(token, this.currentKey);
      return { userId: decoded.userId, email: decoded.email, role: decoded.role };
    } catch (error) {
      // BUG: Should try previousKeys array here but doesn't
      logger.error(`JWT token validation failed: signature mismatch`);
      return null;
    }
  }

  /**
   * Rotate key - BUG: Doesn't save old key to previousKeys.
   * BUG: Doesn't notify downstream services of rotation.
   */
  rotateKey(newKey) {
    // BUG: Should push this.currentKey to this.previousKeys before overwriting
    this.currentKey = newKey;
    // BUG: Missing - broadcast key rotation event to other services
    // BUG: Missing - grace period for old tokens
    logger.warn('Key rotation detected but downstream propagation incomplete');
  }

  /**
   * Refresh token endpoint.
   * BUG: Doesn't handle the case where refresh token was signed with old key.
   */
  async refreshToken(refreshToken) {
    const decoded = this.validateToken(refreshToken);
    if (!decoded) {
      // BUG: Returns null instead of trying previous keys
      // This causes cascading 401s after key rotation
      logger.error('Token refresh endpoint returning 503');
      return null;
    }
    return this.signToken(decoded);
  }
}

module.exports = { authService: new AuthService() };
