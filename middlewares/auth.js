const checkLoggedIn = (req, res, next) => {
  if (req.session && req.session.user) {
    next();
  } else {
    console.log('User not logged in');
    // Store the current URL to redirect back after login
    const returnUrl = encodeURIComponent(req.originalUrl);
    res.redirect(`/auth/login?fromUrl=${returnUrl}`);
  }
};

const bypassLogin = (req, res, next) => {
  if (!req.session || !req.session.user) {
    next();
  } else {
    res.redirect('/');
  }
};

const setUserToResponseLocals = (req, res, next) => {
  res.locals.user = req.session.user;
  next();
};

module.exports = {
  checkLoggedIn,
  bypassLogin,
  setUserToResponseLocals
};