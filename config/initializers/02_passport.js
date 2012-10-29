var passport = require('passport')
, config = require('../config')
, BrowserIDStrategy = require('passport-browserid').Strategy
, db = require('../../lib/model');

module.exports = function(){ 

  passport.serializeUser(function(user, done) {
    console.log(user);
    done(null, user._id);
  });

  passport.deserializeUser(function(email, done) {
    db.User.findOne({_id: email}, done);
  });

  passport.use(
    new BrowserIDStrategy({
      audience: config.baseUri
    }, function(email, done) {
      process.nextTick(function () {
        return done(null, { _id: email })
      });
    })
  );
};
