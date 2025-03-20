const express = require('express');
const {bypassLogin} = require('../../middlewares/auth');
const userValidators = require('../../validators/user');
const authController = require('../../controllers/web/auth');

const router = express.Router();

// Login routes
router.get('/login', bypassLogin, authController.getLoginPage);

router.post('/login', userValidators.login, authController.performLogin);

// Logout route
router.get('/logout', authController.performLogout);

// Register routes
router.get('/register', bypassLogin, authController.getRegisterPage);

router.post('/register', userValidators.createUser, authController.performRegister);

// Export of the router
module.exports = router;