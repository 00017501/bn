const { body } = require('express-validator');

const userValidation = {
  createUser: [
    body('username')
      .notEmpty().withMessage('Username is required')
      .isLength({ min: 3, max: 30 }).withMessage('Username must be between 3 and 30 characters')
      .matches(/^[a-zA-Z0-9_-]+$/).withMessage('Username can only contain letters, numbers, underscores and hyphens')
      .trim(),

    body('email')
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Invalid email address')
      .normalizeEmail(),

    body('fullName')
      .optional()
      .isLength({ max: 100 }).withMessage('Full name cannot exceed 100 characters')
      .trim(),

    body('password')
      .notEmpty().withMessage('Password is required')
      .matches(/\d/).withMessage('Password must contain at least one number'),

    body('confirmPassword')
      .notEmpty().withMessage('Confirm password is required')
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Passwords do not match');
        }
        return true;
      }),
  ],


  // Login validation rules
  login: [
    body('username')
      .notEmpty().withMessage('Username is required')
      .isLength({ min: 3, max: 30 }).withMessage('Username must be between 3 and 30 characters')
      .matches(/^[a-zA-Z0-9_-]+$/).withMessage('Username can only contain letters, numbers, underscores and hyphens')
      .trim(),

    body('password')
      .notEmpty().withMessage('Password is required')
  ],

};

module.exports = userValidation;