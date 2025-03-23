const { validationResult } = require('express-validator');
const storyService = require('../../services/story');
const commentService = require('../../services/comment');

/**
 * Controller handling story-related operations
 */
const storyController = {
  /**
   * Renders the stories-list page
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getListPage: (req, res) => {
    try {
      // Params used for filtering
      const { query, tags } = req.query;

      const viewerId = req.session.user ? req.session.user.id : null;

      // Parse tags if they exist
      const parsedTags = tags ? tags.split(',').map(tag => tag.trim()) : [];

      // Get all stories (after filters are applied in the service)
      const stories = storyService.getAll({ 
        viewerId: viewerId,
        searchQuery: query,
        tagsQuery: parsedTags
      });
      
      const responseData = {
        title: 'Stories',
        success: true,
        stories: stories || [],
        searchQuery: query,
        searchTags: tags,
      };

      res.render('stories/list', responseData);
    } catch (error) {
      console.error('Error fetching stories:', error);
      
      const responseData = {
        title: 'Stories',
        success: false,
        generalMessage: {
          type: 'error',
          message: 'Failed to load stories. Please try again later.'
        },
      };
      
      res.status(500).render('stories/list', responseData);
    }
  },
  
  /**
   * Renders a single story page
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getDetailPage: (req, res) => {
    try {
      const storyId = req.params.id;
      const viewerId = req.session.user ? req.session.user.id : null;
      
      const story = storyService.getById(storyId, viewerId);
      
      if (!story) {
        return res.status(404).render('errors/404', {
          title: 'Story Not Found',
        });
      }
      
      // Increment view count
      storyService.incrementViewCount(storyId);
      
      const responseData = {
        title: story.title,
        success: true,
        story,
      };
      
      res.render('stories/detail', responseData);
    } catch (error) {
      console.error('Error in getStoryPage:', error);
      // Send a generic error response
      res.status(500).render('errors/500', {
        title: 'Server Error',
        message: 'An unexpected error occurred.'
      });
    }
  },
  
  
  /**
   * Renders the create story page
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getCreatePage: (req, res) => {

    const responseData = {
      title: 'Create Story',
      success: true,
      additionalData: {
        formData: {}
      },
    };
    
    res.render('stories/create', responseData);
  },
  
  /**
   * Handles story creation
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  createStory: async (req, res) => {
    
    // Initialize response object
    const responseData = {
      title: 'Create Story',
      success: false,
      additionalData: {
        formData: req.body
      },
    };
    
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        responseData.errors = errors.array();
        responseData.generalMessage = {
          type: 'error',
          message: 'Please correct the errors below'
        };

        
        return res.status(400).render('stories/create', responseData);
      }
      
      // Parse tags if they exist
      let tags = req.body.tags;
      
      // Create story
      const story = storyService.create({
        author_id: req.session.user.id,
        title: req.body.title,
        content: req.body.content,
        is_anonymous: req.body.is_anonymous === 'on',
        is_draft: req.body.is_draft === 'on',
        tags
      });
      
      // Redirect to detail page adter the story is created
      return res.redirect(`/stories/${story.id}`);

    } catch (error) {
      console.error('Error creating story:', error);
      
      responseData.generalMessage = {
        type: 'error',
        message: 'Failed to create story. Please try again later.'
      };
      
      return res.status(500).render('stories/create', responseData);
    }
  },
  
  /**
   * Renders the edit story page
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getEditPage: (req, res) => { 
    try {
      const storyId = req.params.id;
      const story = storyService.getById(storyId);
      
      // Check if story exists and user is the author
      if (!story) {
        return res.status(404).render('errors/404', {
          title: 'Story Not Found',
          user: req.session.user
        });
      }
      // Make sure the edit page is only accessible to the author of the story
      if (story.author_id !== req.session.user.id) {
        return res.status(403).render('errors/403', {
          title: 'Unauthorized',
          user: req.session.user
        });
      }
      
      // Format tags for form
      const tagsString = story.tags ? story.tags.join(', ') : '';
      
      const responseData = {
        title: 'Edit Story',
        success: true,
        additionalData: {
          formData: {
            ...story,
            tags: tagsString
          }
        },
        user: req.session.user
      };
      
      res.render('stories/edit', responseData);
    } catch (error) {
      console.error('Error fetching story for edit:', error);
      
      const responseData = {
        title: 'Edit Error',
        success: false,
        generalMessage: {
          type: 'error',
          message: 'Failed to load story for editing. Please try again later.'
        },
        user: req.session.user
      };
      
      res.status(500).render('stories/edit', responseData);
    }
  },
  
  /**
   * Handles story update
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  updateStory: async (req, res) => {
    
    const storyId = req.params.id;
    
    const responseData = {
      title: 'Edit Story',
      success: false,
      additionalData: {
        formData: req.body
      },
      user: req.session.user
    };
    
    try {
      // Get the story
      const story = storyService.getById(storyId);
      
      // Check if story exists and user is the author
      if (!story) {
        return res.status(404).render('errors/404', {
          title: 'Story Not Found',
          user: req.session.user
        });
      }
      
      if (story.author_id !== req.session.user.id) {
        return res.status(403).render('errors/403', {
          title: 'Unauthorized',
          user: req.session.user
        });
      }
      
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        responseData.errors = errors.array();
        responseData.generalMessage = {
          type: 'error',
          message: 'Please correct the errors below'
        };
        
        return res.status(400).render('stories/edit', responseData);
      }
      
      // Parse tags if they exist
      let tags = req.body.tags;
      
      // Update story
      const updatedStory = storyService.update(storyId, {
        title: req.body.title,
        content: req.body.content,
        is_anonymous: req.body.is_anonymous === 'on',
        is_draft: req.body.is_draft === 'on',
        tags
      });
      
      return res.redirect(`/stories/${updatedStory.id}`);
    } catch (error) {
      console.error('Error updating story:', error);
      
      responseData.generalMessage = {
        type: 'error',
        message: 'Failed to update story. Please try again later.'
      };
      
      return res.status(500).render('stories/edit', responseData);
    }
  },
  
  /**
   * Handles story deletion
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  deleteStory: (req, res) => {
    
    try {
      const storyId = req.params.id;
      const story = storyService.getById(storyId);
      
      // Check if story exists and user is the author
      if (!story) {
        return res.status(404).json({
          success: false,
          message: 'Story not found'
        });
      }
      
      if (story.author_id !== req.session.user.id) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to delete this story'
        });
      }
      
      // Delete the story
      const deleted = storyService.delete(storyId);
      
      if (deleted) {
        return res.json({
          success: true,
          message: 'Story deleted successfully'
        });
      } else {
        return res.status(500).json({
          success: false,
          message: 'Failed to delete story'
        });
      }
    } catch (error) {
      console.error('Error deleting story:', error);
      
      return res.status(500).json({
        success: false,
        message: 'An error occurred while deleting the story'
      });
    }
  },
  
  /**
   * Toggles like to the story
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  toggleLike: (req, res) => {
    try {
      const storyId = req.params.id;
      const userId = req.session.user.id;
      const action = req.body.action; // 'like' or 'unlike'
      
      // Get the story
      const story = storyService.getById(storyId, userId);
      
      if (!story) {
        return res.status(404).json({
          success: false,
          message: 'Story not found'
        });
      }
      
      let success = false;
      
      success = storyService.toggleLike(storyId, userId);
      
      if (success) {
        // Get updated story with new like count
        const updatedStory = storyService.getById(storyId, userId);
        
        return res.json({
          success: true,
          message: action === 'like' ? 'Story liked successfully' : 'Story unliked successfully',
          likes_count: updatedStory.likes_count,
          has_viewer_liked: updatedStory.has_viewer_liked
        });
      } else {
        return res.status(500).json({
          success: false,
          message: 'Failed to process like/unlike'
        });
      }
    } catch (error) {
      console.error('Error processing like/unlike:', error);
      
      return res.status(500).json({
        success: false,
        message: 'An error occurred while processing like/unlike'
      });
    }
  },
  
  /**
   * Toggles bookmark to the story
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  toggleBookmark: (req, res) => {
    // Check if user is logged in
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        message: 'You must be logged in to bookmark stories'
      });
    }
    
    try {
      const storyId = req.params.id;
      const userId = req.session.user.id;
      const action = req.body.action; // 'bookmark' or 'unbookmark'
      
      // Get the story
      const story = storyService.getById(storyId, userId);
      
      if (!story) {
        return res.status(404).json({
          success: false,
          message: 'Story not found'
        });
      }
      
      let success = false;
      
      success = storyService.toggleBookmark(storyId, userId);
      
      
      if (success) {
        // Get updated story with new bookmark count
        const updatedStory = storyService.getById(storyId, userId);
        
        return res.json({
          success: true,
          message: action === 'bookmark' ? 'Story bookmarked successfully' : 'Story unbookmarked successfully',
          bookmarks_count: updatedStory.bookmarks_count,
          has_viewer_bookmarked: updatedStory.has_viewer_bookmarked
        });
      } else {
        return res.status(500).json({
          success: false,
          message: 'Failed to process bookmark/unbookmark'
        });
      }
    } catch (error) {
      console.error('Error processing bookmark/unbookmark:', error);
      
      return res.status(500).json({
        success: false,
        message: 'An error occurred while processing bookmark/unbookmark'
      });
    }
  },
  

  /**
    * Handles creating a new comment
    * @param {Object} req - Express request object
    * @param {Object} res - Express response object
    */
  createComment: (req, res) => {
    // Initialize response data
    const responseData = {
      success: false,
      title: 'Error',
      additionalData: {
        formData: req.body
      }
    };
    
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        responseData.errors = errors.array();
        res.status(400).render('stories/create', responseData);
      }
    
      // Create comment
      commentService.create({
        authorId: req.session.user.id,
        storyId: req.params.id,
        content: req.body.content,
      });
    
      responseData.success = true;
      responseData.title = 'Comment Created';
    
      const storyUrl = `/stories/${req.params.id}`;

      res.redirect(storyUrl);
    } catch (error) {
      responseData.error = error.message;
      console.log(error);
    
      res.status(500).render('errors/500', responseData);

    }
  }
};

module.exports = storyController;