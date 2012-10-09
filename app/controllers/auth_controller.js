var locomotive = require('locomotive')
, Controller = locomotive.Controller
, passport = require('passport')
, model = require('../../lib/model');

var AuthController = module.exports =  new Controller();

AuthController.browserid = function() {
  console.log("did bid auth");
  this.res.json(JSON.stringify(this.req.user));
}
AuthController.before('browserid', passport.authenticate('browserid'));

AuthController.logout = function() {
  this.req.logOut();
  this.res.redirect('/');
}

AuthController.getOAuth2Transaction = function(){
  this.res.json(this.req.oauth2);
};

AuthController.before('getOAuth2Transaction', function(req, res, next){
  var server = this.__req.app.get('oauth2server');
  server.loadTransaction(req, res, next);
});

AuthController.launch = function() {
  console.log("so aunchinl ", this.req.oauth2);
  this.res.redirect('/ui/authorize?transaction_id='+this.req.oauth2.transactionID);
}

AuthController.before('launch', function(req, res, next){
  var server = this.__req.app.get('oauth2server');
  server.authorization(function(areq, done) {
    model.App.findOne(areq.clientID, function(err, app) {
      if (err) { return done(err); }
      return done(null, app, app.index);
    });
  })(req, res, next);
});

AuthController.before('launch', function(req, res, next){
//TODO logic for short-circuiting auth based on long-standing prefs
// goes here...
  console.log("Initialized a txn. Now in f/u mw.", req.oauth2);
  next();
});


AuthController.decide = function() {
  var server = this.req.locomotive.app.get('oauth2server');
  server.decision(function(req, done){
    done({patient: req.params('patient')}) // maybe scope etc. too?
  });
}

AuthController.ensureAuthenticated = function() {
  console.log("ensuring auth");
  if (this.req.isAuthenticated()){
    return this.next();
  }
  this.res.render('login.ejs');
}

//TODO: complete
AuthController.authorizeApp = function(){
  var app = App.findOne(this.req.app);
  var user = App.findOne(this.req.user);
} 
