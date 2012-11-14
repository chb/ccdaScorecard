var passport = require('passport')
, config = require('../index')
, BrowserIDStrategy = require('passport-browserid').Strategy
, db = require('../../lib/model');

var app = config.app;

passport.serializeUser(function(user, done) {
  console.log(user);
  done(null, user._id);
});

passport.deserializeUser(function(email, done) {
  db.User.findOne({_id: email}, done);
});

passport.use(
  new BrowserIDStrategy({
    audience: config.publicUri
  }, function(email, done) {
    process.nextTick(function () {
      return done(null, { _id: email })
    });
  })
);
