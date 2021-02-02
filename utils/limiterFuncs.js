const rateLimit = require('express-rate-limit');

const logInLimiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 min
  max: 10,
  message: {
    status: 'failure',
    message: 'Please try again after 2 min!',
  },
});

module.exports = logInLimiter;
