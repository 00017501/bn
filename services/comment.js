const {readSource, writeToSource, generateUniqueIdForSource, Sources} = require('../data/utils');

const commentService = {
  /**
   * Create a new comment
   * @param {Object} commentData - Comment data 
   * @param {string} commentData.authorId - ID of the comment author
   * @param {string} commentData.storyId - ID of the story the comment belongs to
   * @param {string} commentData.content - Comment content
   */
  create(commentData) {
    const {authorId, storyId, content} = commentData;
    console.log(`DATA: ${authorId}, ${storyId}, ${content}`);

    // Validate comment data
    if (!authorId || !storyId || !content) {
      throw new Error('Invalid comment data');
    }

    // Create comment
    let comments = readSource('comments');

    const newComment = {
      id: generateUniqueIdForSource(Sources.COMMENTS),
      author_id: authorId,
      story_id: storyId,
      content,
      created_at: new Date().toISOString(),
    };

    comments.push(newComment);

    writeToSource('comments', comments);

  },

};

module.exports = commentService;