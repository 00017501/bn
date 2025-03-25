const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const config = require('../config');
/**
 * Enum for data source types.
 * Each value represents a different collection of data stored in separate JSON files.
 * @readonly
 * @enum {string}
 */
const Sources = Object.freeze({
  USERS: 'users',
  BOOKMARKS: 'bookmarks',
  STORIES: 'stories',
  COMMENTS: 'comments',
  LIKES: 'likes'
});

/**
 * Validates if the provided source is legitimate.
 * @private
 * @param {Sources} source - The source type to validate.
 * @throws {Error} If the source is not one of the defined Sources values.
 */
const _validateSource = (source) => {
  if (!Object.values(Sources).includes(source)) {
    throw new Error(`Invalid source: ${source}. Must be one of: ${Object.values(Sources).join(', ')}`);
  }
};

/**
 * Builds the full path to a source JSON file.
 * @private
 * @param {Sources} source - The source type.
 * @returns {string} The full path to the corresponding JSON file.
 */
const _buildSourcePath = (source) => {
  if (config.server.env === 'production') {
    console.log('Accessing production data');
    return path.join(__dirname, 'prod', `${source}.json`);  
  } else {
    console.log('Accessing development data');
    return path.join(__dirname, 'dev', `${source}.json`);
  }
};


/**
 * Reads and parses data from a source JSON file.
 * @param {Sources} source - The source type (should be one of Sources enum values).
 * @returns {Object} The parsed JSON data from the requested source.
 * @throws {Error} If the source is invalid or the file cannot be found/read.
 */
const readSource = (source) => {
  _validateSource(source);
  
  const sourcePath = _buildSourcePath(source);
  
  try {
    // Read and parse the JSON file synchronously
    const fileContent = fs.readFileSync(sourcePath, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    throw new Error(`Failed to read from ${source} source: ${error.message}`);
  }
};

/**
 * Writes data to a source JSON file.
 * @param {Sources} source - The source type (should be one of Sources enum values).
 * @param {Object|Array} objects - The data to write to the file.
 * @returns {Promise<void>} A promise that resolves when the write operation completes.
 * @throws {Error} If the source is invalid or the write operation fails.
 */
const writeToSource = (source, objects) => {
  _validateSource(source);
  
  const sourcePath = _buildSourcePath(source);
  
  try {
    fs.writeFileSync(
      sourcePath,
      JSON.stringify(objects, null, 4), // Pretty-print with 4-space indentation
      'utf8'
    );
  } catch (error) {
    throw new Error(`Failed to write to ${source} source: ${error.message}`);
  }
};

/**
 * Generates a unique UUID-like identifier.
 * Can be used for creating unique IDs for new records.
 * @returns {string} A unique UUID v4 string
 */
const _generateUniqueId = () => {
  return crypto.randomUUID();
};
  
/**
 * Checks if an ID already exists in a specific source collection.
 * @param {Sources} source - The source type to check
 * @param {string} id - The ID to check for uniqueness
 * @returns {boolean} True if the ID is unique (doesn't exist), false otherwise
 */
const _isUniqueId = (source, id) => {
  const data = readSource(source);
  return !data.some(item => item.id === id);
};

/**
 * Generates a guaranteed unique ID for a specific source collection.
 * @param {Sources} source - The source collection to check against
 * @returns {string} A unique ID that doesn't exist in the specified collection
 */
const generateUniqueIdForSource = (source) => {
  let id = _generateUniqueId();
  while (!_isUniqueId(source, id)) {
    id = _generateUniqueId();
  }
  return id;
};

module.exports = {
  Sources,
  readSource,
  writeToSource,
  generateUniqueIdForSource,
};