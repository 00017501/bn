const config = require('../config');
// 404 handler

const handle404 = (req, res) => {
  res.status(404).render('errors/404', {
    title: 'Page Not Found | BR✨',
    url: req.originalUrl,
  });
};

// Error handler
const handleServerError = (err, req, res) => {
  console.error(err.stack);
  const statusCode = err.status || 500;

  if (req.accepts('html')) {
    res.status(statusCode).render('errors/500', {
      title: 'Server Error',
      error: config.server.env === 'development' ? err : {},
    });
  } else {
    res.status(statusCode).json({
      error: {
        message:
                    config.server.env === 'development'
                      ? err.message
                      : 'Internal Server Error',
        status: statusCode,
      },
    });
  }
};

module.exports = {
  handle404,
  handleServerError,
};
