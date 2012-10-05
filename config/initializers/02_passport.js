var passport = require('passport')
, config = require('../config')
, BrowserIDStrategy = require('passport-browserid').Strategy;
module.exports = function(){ 

  passport.serializeUser(function(user, done) {
    done(null, user.email);
  });

  passport.deserializeUser(function(email, done) {
    done(null, { email: email });
  });


  passport.use(
    new BrowserIDStrategy({
      audience: config.baseUri
    }, function(email, done) {
      process.nextTick(function () {
        return done(null, { email: email })
      });
    })
  );
};
