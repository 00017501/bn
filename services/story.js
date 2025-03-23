const { 
  Sources, 
  readSource, 
  writeToSource, 
  generateUniqueIdForSource 
} = require('../data/utils');

// To render markdown content as HTML (Reference: https://www.youtube.com/watch?v=1NrHkjlWVhM)
const marked = require('marked');
const createDomPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const dompurify = createDomPurify(new JSDOM().window);

// Service that handles different story related operations
const storyService = {
  /**
   * Get all stories with some optional filtering
   * @param {Object} options - Query options
   * @param {boolean} [options.isDraft] - Filter by draft status
   * @param {string} [options.authorId] - Filter by author ID
   * @param {string} [options.searchQuery] - Search filter
   * @param {string} [options.tagsQuery] - Search filter
   * @param {string} [options.viewerId] - Current viewer's user ID
   * @returns {Array} Array of stories with engagement metrics
   */
  getAll(options = {}) {
    const { isDraft, authorId, searchQuery, tagsQuery, viewerId } = options;
    let stories = readSource(Sources.STORIES);
    
    // Apply filters
    if (isDraft !== undefined) {
      stories = stories.filter(story => story.is_draft === isDraft);
    }

    if (authorId) {
      stories = stories.filter(story => story.author_id === authorId);
    }

    if (searchQuery) {
      stories = stories.filter(story =>
        story.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        story.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (tagsQuery && tagsQuery.length) {
      stories = stories.filter(story => 
        story.tags && tagsQuery.some(queryTag => 
          story.tags.some(storyTag => 
            storyTag.toLowerCase().includes(queryTag.toLowerCase())
          )
        )
      );
    }

    // Sort by created date in descending order
    stories = stories.sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    );
    
    // Attach engagement metrics (likes, bookmarks)
    return this._attachEngagementMetrics(stories, viewerId);
  },

  /**
   * Get a story by ID
   * @param {string} id - Story ID
   * @param {string} [viewerId] - Current viewer's user ID
   * @returns {Object|null} Story object or null if not found
   */
  getById(id, viewerId) {
    const stories = readSource(Sources.STORIES);
    const story = stories.find(story => story.id === id) || null;

    if (!story) return null;

    // Retrieve story comments and attach to the story
    const comments = readSource(Sources.COMMENTS);
    const storyComments = comments.filter(comment => comment.story_id === id);


    // Attach author data to  comments
    const users = readSource(Sources.USERS);
    storyComments.map(comment => {
      const author = users.find(user => user.id === comment.author_id);
      comment.author = author || { id: comment.author_id };
    }
    );

    storyComments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
    // Return single story with engagement metrics
    let finalStory = this._attachEngagementMetrics([story], viewerId)[0];
    finalStory.comments = storyComments;

    console.log(finalStory);

    return finalStory;
  },

  /**
   * Increment the view count of a story
   * @param {string} id - Story ID
   * @returns {boolean} True if updated, false if not found
   */
  incrementViewCount(id) {
    const stories = readSource(Sources.STORIES);
    const storyIndex = stories.findIndex(story => story.id === id);
    
    if (storyIndex === -1) {
      return false;
    }
    
    // Increment view count
    stories[storyIndex].views_count = (stories[storyIndex].views_count || 0) + 1;
    stories[storyIndex].updated_at = new Date().toISOString();
    
    writeToSource(Sources.STORIES, stories);
    return true;
  },

  /**
   * Create a new story
   * @param {Object} data - Story data
   * @param {string} data.author_id - Author ID
   * @param {string} data.title - Story title
   * @param {string} data.content - Story content
   * @param {boolean} [data.is_anonymous=false] - Whether the story is anonymous
   * @param {boolean} [data.is_draft=false] - Whether the story is a draft
   * @param {Array<string>} [data.tags=[]] - Array of tags
   * @returns {Object} Created story
   */
  create(data) {
    const stories = readSource(Sources.STORIES);
    
    // Generate unique ID for the new story
    const id = generateUniqueIdForSource(Sources.STORIES);
    
    const newStory = {
      id,
      author_id: data.author_id,
      title: data.title,
      content: data.content,
      is_anonymous: data.is_anonymous || false,
      is_draft: data.is_draft !== undefined ? data.is_draft : false,
      tags: data.tags || [],
      views_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Save story to data source
    stories.push(newStory);
    writeToSource(Sources.STORIES, stories);
    
    return newStory;
  },

  /**
   * Update a story
   * @param {string} id - Story ID
   * @param {Object} data - Updated story data
   * @param {string} [data.title] - Story title
   * @param {string} [data.content] - Story content
   * @param {boolean} [data.is_anonymous] - Whether the story is anonymous
   * @param {boolean} [data.is_draft] - Whether the story is a draft
   * @param {Array<string>} [data.tags] - Array of tags
   * @returns {Object} Updated story
   */
  update(id, data) {
    const stories = readSource(Sources.STORIES);
    const storyIndex = stories.findIndex(story => story.id === id);
    
    if (storyIndex === -1) {
      throw new Error('Story not found');
    }
    
    // Update story data
    const updatedStory = {
      ...stories[storyIndex],
      ...data,
      updated_at: new Date().toISOString()
    };
    
    stories[storyIndex] = updatedStory;
    writeToSource(Sources.STORIES, stories);
    
    return updatedStory;
  },

  /**
   * Delete a story (and associated comments, bookmarks, likes)
   * @param {string} id - Story ID
   * @returns {boolean} True if deleted, false if not found
   */
  delete(id) {
    const stories = readSource(Sources.STORIES);
    const storyIndex = stories.findIndex(story => story.id === id);
    
    if (storyIndex === -1) {
      return false;
    }
    
    // Delete the story
    stories.splice(storyIndex, 1);
    writeToSource(Sources.STORIES, stories);
    
    // Delete associated comments
    const comments = readSource(Sources.COMMENTS);
    const updatedComments = comments.filter(comment => comment.story_id !== id);
    writeToSource(Sources.COMMENTS, updatedComments);

    // Delete associated bookmarks
    const bookmarks = readSource(Sources.BOOKMARKS);
    const updatedBookmarks = bookmarks.filter(bookmark => bookmark.story_id !== id);
    writeToSource(Sources.BOOKMARKS, updatedBookmarks);

    // Delete associated likes
    const likes = readSource(Sources.LIKES);
    const updatedLikes = likes.filter(like => like.story_id !== id);
    writeToSource(Sources.LIKES, updatedLikes);
    
    return true;
  },

  // Like/unlike a story
  toggleLike(storyId, userId) {

    const likes = readSource(Sources.LIKES);
    const existingLike = likes.find(like => like.story_id === storyId && like.user_id === userId);
    
    if (existingLike) {
      // Unlike if already liked
      likes.splice(likes.indexOf(existingLike), 1);
    } else {
      // Like the story
      likes.push({ story_id: storyId, user_id: userId });
    }
    
    writeToSource(Sources.LIKES, likes);

    return true;
  },
  // Bookmark/unbookmark a story
  toggleBookmark(storyId, userId) {

    const bookmarks = readSource(Sources.BOOKMARKS);
    const existingBookmark = bookmarks.find(bookmark => bookmark.story_id === storyId && bookmark.user_id === userId);

    if (existingBookmark) {
      // Unlike if already bookmarked
      bookmarks.splice(bookmarks.indexOf(existingBookmark), 1);
    }
    else {
      // Bookmark the story
      bookmarks.push({ story_id: storyId, user_id: userId });
    }

    writeToSource(Sources.BOOKMARKS, bookmarks);

    return true;
  },
  
  /**
 * Attach engagement metrics to stories
 * @param {Array} stories - Array of stories
 * @param {string} [viewerId] - Current viewer's user ID
 * @returns {Array} Stories with attached metrics
 * @private
 */
  _attachEngagementMetrics(stories, viewerId) {
    if (!stories.length) return [];
  
    const likes = readSource(Sources.LIKES);
    const bookmarks = readSource(Sources.BOOKMARKS);
    const users = readSource(Sources.USERS);
    const comments = readSource(Sources.COMMENTS);
  
    return stories.map(story => {
    // Count likes, comments, and bookmarks
      const storyLikes = likes.filter(like => like.story_id === story.id);
      const storyBookmarks = bookmarks.filter(bookmark => bookmark.story_id === story.id);
      const storyComments = comments.filter(comment => comment.story_id === story.id);
    
      // Get viewer interaction flags if viewerId is provided
      let hasViewerLiked = false;
      let hasViewerBookmarked = false;
    
      if (viewerId) {
        hasViewerLiked = storyLikes.some(like => like.user_id === viewerId);
        hasViewerBookmarked = storyBookmarks.some(bookmark => bookmark.user_id === viewerId);
      }
    
      // Find author info
      let authorInfo = null;
      if (story.author_id && !story.is_anonymous) {
        const author = users.find(user => user.id === story.author_id);
        if (author) {
          const { password_hash, ...authorData } = author;
          authorInfo = authorData;
        }
      }
    
      // Return story with metrics
      return {
        ...story,
        sanitizedContent: dompurify.sanitize(marked.parse(story.content)),
        is_my_story: (viewerId && story.author_id === viewerId) || false,
        likes_count: storyLikes.length,
        bookmarks_count: storyBookmarks.length,
        comments_count: storyComments.length,
        has_viewer_liked: hasViewerLiked,
        has_viewer_bookmarked: hasViewerBookmarked,
        author: story.is_anonymous 
          ? { id: story.author_id, is_anonymous: true } 
          : (authorInfo || story.author || { id: story.author_id })
      };
    });
  }
};

module.exports = storyService;