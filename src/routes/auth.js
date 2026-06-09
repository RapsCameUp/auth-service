const express = require('express');
const router = express.Router();
const { logger } = require('../utils/logger');

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  logger.info(`Login attempt for ${email}`);
  res.json({ token: `jwt-${Date.now()}`, user: { email, role: 'user' } });
});

router.post('/register', (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  logger.info(`New registration: ${email}`);
  res.status(201).json({ message: 'User registered', user: { email, name } });
});

router.get('/verify', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  res.json({ valid: true, user: { email: 'user@example.com' } });
});

router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });
  res.json({ token: `jwt-${Date.now()}`, expiresIn: 3600 });
});

module.exports = router;
