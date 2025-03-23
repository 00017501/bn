const express = require('express');
const router = express.Router();
const { checkLoggedIn } = require('../../middlewares/auth');
const storyValidators = require('../../validators/story');
const storyController = require('../../controllers/web/stories');

// Get all published stories
router.get('/', storyController.getListPage);

// Story creation routes
router.get('/create', checkLoggedIn, storyController.getCreatePage);
router.post('/create', checkLoggedIn, storyValidators.createStory, storyController.createStory);


// Get story detail page
router.get('/:id', checkLoggedIn, storyController.getDetailPage);


// Toggle like/unlike story 
router.post('/:id/like', checkLoggedIn, storyController.toggleLike);

// Toggle bookmark/unbookmark story
router.post('/:id/bookmark', checkLoggedIn, storyController.toggleBookmark);


// Create comment by story ID
router.post('/:id/comment', checkLoggedIn, storyController.createComment);


// Story edit routes
router.get('/:id/edit', checkLoggedIn, storyController.getEditPage);
router.post('/:id/edit', checkLoggedIn, storyValidators.updateStory, storyController.updateStory);

// Delete story by ID
router.delete('/:id/delete', checkLoggedIn, storyController.deleteStory);


module.exports = router;