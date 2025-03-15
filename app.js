// Load environment variables first
require('dotenv').config({
  path: `.env.${process.env.NODE_ENV || 'dev'}`,
});

const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const config = require('./config');
const logger = require('./middlewares/logger.js');
const session = require('express-session');
const { handle404, handleServerError } = require('./middlewares/error.js');
const { setUserToResponseLocals } = require('./middlewares/auth.js');

const app = express();

// Logging middleware
app.use(logger);


// Environment setup
app.set('env', config.server.env);
app.set('port', config.server.port || 3000);

// Request parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configure session (References: https://youtu.be/-ebXpRi1yQg?si=XITGyMG6N0WiG8ld)
app.use(session({
  secret: config.server.secretKey,
  resave: false,
  saveUninitialized: false,
  name: 'boundlessnarrative.com',
  cookie: {
    maxAge: 86400000, // 1 day
    secure: false 
  }
}));

// Set user to response locals
app.use(setUserToResponseLocals);

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layouts/base');

// Static files middleware
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// Routes
const routes = require('./routes');
app.use('/', routes);

// Error handling middleware
app.use(handle404);
app.use(handleServerError);

// Start server
app.listen(app.get('port'), () => {
  console.log(
    `Server running at ${
      config.server.baseUrl
    }/ in ${config.server.env.toUpperCase()} mode`
  );
});

module.exports = app;
