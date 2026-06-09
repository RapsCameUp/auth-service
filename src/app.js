const express = require('express');
const authRoutes = require('./routes/auth');
const { logger } = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use('/auth', authRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'auth-service', uptime: process.uptime() });
});

app.listen(PORT, () => {
  logger.info(`auth-service running on port ${PORT}`);
});

module.exports = app;
