var passport = require('passport')
, security = require('../security')
, BrowserIDStrategy = require('passport-browserid').Strategy,
config = require('../../../config');

var ensureAuthenticated = security.ensureAuthenticated;

module.exports = function(app){ 

  var BrowserIDStrategy = require('passport-browserid').Strategy
  , passport = require('passport')
  , TestStrategy = require('./test-strategy');

  passport.serializeUser(function(user, done) {
    done(null, user.email);
  });

  passport.deserializeUser(function(email, done) {
    done(null, { email: email });
  });

  passport.use(new TestStrategy());

  app.post('/auth/test', 
    passport.authenticate('test'),
    function(req, res) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(req.user));
    }
  );

  passport.use(new BrowserIDStrategy({
    audience: config.baseUri
  }, function(email, done) {
    process.nextTick(function () {
      return done(null, { email: email })
    });
  }
  ));

  // POST /auth/browserid
  app.post('/auth/browserid', 
    passport.authenticate('browserid'),
    function(req, res) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(req.user));
    }
  );

  // POST /auth/browserid
  app.post('/auth/browserid', 
    passport.authenticate('test'),
    function(req, res) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(req.user));
    }
  );

  app.get('/logout', function(req, res){
    req.logOut();
    res.redirect('/');
  });
};
