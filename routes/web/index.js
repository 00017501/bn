const express = require('express');
const config = require('../../config');
const storiesRouter = require('./stories');
const authRouter = require('./auth');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('index', {
    title: 'Home',
    env: process.env.BN_SERVER_ENV,
  });
});

// Health check route (i saw this to be used when performing periodically quikc check of the status of the server) 
// (References: https://microservices.io/patterns/observability/health-check-api.html)
router.get('/healthcheck', (req, res) => {
  res.json({
    status: 'ok',
    environment: config.server.env,
    timestamp: new Date().toISOString(),
  });
});

router.use('/stories', storiesRouter);

router.use('/auth', authRouter);

module.exports = router;
