const { validationResult } = require('express-validator');
const userService = require('../../services/user');

/**
 * Controller handling authentication operations
 */
const authController = {
  /**
   * Renders the login page
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getLoginPage: (req, res) => {
    // Get the fromUrl parameter if it exists (used to redirect back after login)
    const fromUrl = req.query.fromUrl || '';
    
    const responseData = {
      title: 'Login',
      success: true,
      additionalData: {
        formData: {},
        fromUrl: fromUrl
      }
    };
    
    res.render('auth/login', responseData);
  },
  
  /**
   * Handles user login attempts (the post request coming from the login form)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  performLogin: async (req, res) => {
    const fromUrl = req.body.fromUrl || '';
    
    const responseData = {
      title: 'Login',
      success: false,
      additionalData: {
        formData: req.body,
        fromUrl: fromUrl
      }
    };

    try {
      // Get results of validated request 
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // Format errors for the response
        responseData.errors = errors.array();
        responseData.generalMessage = {
          type: 'error', 
          message: 'Please correct the errors below'
        };
        return res.status(400).render('auth/login', responseData);
      }

      try {
        // Authenticate user
        const user = await userService.authenticate(req.body.username, req.body.password);

        // Very important point as i create a session and store user object in it (it is used in other parts of app)
        // I used the cookie based auth, being inspired by this video (Reference: https://youtu.be/-ebXpRi1yQg?si=XITGyMG6N0WiG8ld)
        req.session.user = user;

        // Redirect to the original URL if provided, otherwise to the home page
        if (fromUrl && fromUrl !== 'undefined') {
          return res.redirect(decodeURIComponent(fromUrl));
        } else {
          return res.redirect('/');
        }
      } catch (authError) {
        // Handle authentication errors
        responseData.generalMessage = {
          type: 'error',
          message: authError.message
        };
        
        responseData.additionalData.formData = { 
          username: req.body.username 
        };

        return res.status(401).render('auth/login', responseData);
      }
    } catch (error) {
      // Log the unexptected error for debugging purposes
      console.error('Login error:', error);

      responseData.generalMessage = {
        type: 'error',
        message: 'An unexpected error occurred. Please try again later.'
      };
      
      responseData.additionalData.formData = { 
        username: req.body.username 
      };

      // For all other unexpected errors
      return res.status(500).render('auth/login', responseData);
    }
  },
  
  /**
   * Handles user logout
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  performLogout: (req, res) => {
    // Get the referer URL if available

    // Inspired by this video (Reference: https://youtu.be/-ebXpRi1yQg?si=XITGyMG6N0WiG8ld)
    const referer = req.get('Referer') || '/';
    
    req.session.destroy();
    res.clearCookie('boundlessnarrative.com');
    
    // Redirect back to the previous page if it's not an auth page
    if (!referer.includes('/auth/')) {
      res.redirect(referer);
    } else {
      res.redirect('/');
    }
  },
  
  /**
   * Renders the registration page
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getRegisterPage: (req, res) => {
    const fromUrl = req.query.fromUrl || '';
    
    const responseData = {
      title: 'Register',
      success: true,
      additionalData: {
        formData: {},
        fromUrl: fromUrl
      }
    };
    
    res.render('auth/register', responseData);
  },
  
  /**
   * Handles new user registration
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  performRegister: async (req, res) => {
    const fromUrl = req.body.fromUrl || '';
    
    // Initialize response object
    const responseData = {
      title: 'Register',
      success: false,
      additionalData: {
        formData: req.body,
        fromUrl: fromUrl
      }
    };

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        responseData.errors = errors.array();
        responseData.generalMessage = {
          type: 'error', 
          message: 'Please correct the errors below'
        };

        return res.status(400).render('auth/register', responseData);
      }

      try {
        // Create new user
        await userService.create({
          username: req.body.username,
          email: req.body.email,
          password: req.body.password,
          fullName: req.body.fullName || ''
        });

        const loginResponseData = {
          title: 'Login',
          success: true,
          generalMessage: {
            type: 'success',
            message: 'Registration successful! You can now log in.'
          },
          additionalData: {
            formData: { username: req.body.username },
            fromUrl: fromUrl
          }
        };
        
        // Redirect to login page with success message and fromUrl
        return res.render('auth/login', loginResponseData);
      } catch (registerError) {
        responseData.generalMessage = {
          type: 'error',
          message: registerError.message
        };
        
        return res.status(400).render('auth/register', responseData);
      }
    } catch (error) {
      // Log the error for debugging purposes
      console.error('Registration error:', error);

      responseData.generalMessage = {
        type: 'error',
        message: 'An unexpected error occurred. Please try again later.'
      };

      return res.status(500).render('auth/register', responseData);
    }
  },

};

module.exports = authController;