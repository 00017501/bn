const config = {
  server: {
    port: process.env.BN_SERVER_PORT || 3000,
    env: process.env.BN_SERVER_ENV || 'development',
    baseUrl: process.env.BN_BASE_URL || 'http://localhost:3000',
    domain: process.env.BN_DOMAIN,
    secretKey: process.env.BN_SECRET_KEY,
  },
  logging: {
    level: process.env.BN_LOG_LEVEL || 'debug',
  },
};

const requiredFields = ['server.env'];

requiredFields.forEach((field) => {
  const value = field.split('.').reduce((obj, key) => obj[key], config);
  if (!value) {
    throw new Error(`Required config field ${field} is missing`);
  }
});

module.exports = config;
