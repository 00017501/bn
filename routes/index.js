const express = require('express');
const router = express.Router();

const webRouter = require('./web');

// Register routes
router.use('/', webRouter);

module.exports = router;
