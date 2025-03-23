const { body, param } = require('express-validator');

const storyValidation = {
  // Validation rules for creating a story
  createStory: [
    body('title')
      .notEmpty().withMessage('Title is required')
      .isLength({ min: 1, max: 200 }).withMessage('Title must be between 1 and 200 characters')
      .trim(),

    body('content')
      .notEmpty().withMessage('Content is required')
      .isLength({ min: 3 }).withMessage('Content should be at least 3 characters')
      .trim(),

    body('tags')
      .optional()
      .isString().withMessage('Tags must be a comma-separated string')
      .trim()
      .customSanitizer(value => {
        if (!value) return [];
        // Convert comma-separated string to array and trim each tag
        return value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      }),

    body('is_anonymous')
      .optional(),
      
    body('is_draft')
      .optional()
  ],

  // Validation rules for updating a story
  updateStory: [
    param('id')
      .notEmpty().withMessage('Story ID is required')
      .isUUID(4).withMessage('Story ID must be a valid UUID v4'),
    
    body('title')
      .optional()
      .isLength({ min: 1, max: 200 }).withMessage('Title must be between 3 and 200 characters')
      .trim(),

    body('content')
      .optional()
      .isLength({ min: 3 }).withMessage('Content should be at least 50 characters')
      .trim(),

    body('tags')
      .optional()
      .isString().withMessage('Tags must be a comma-separated string')
      .trim()
      .customSanitizer(value => {
        if (!value) return [];
        // Convert comma-separated string to array and trim each tag
        return value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      }),

    body('is_anonymous')
      .optional(),

    body('is_draft')
      .optional()
  ],

};

module.exports = storyValidation;