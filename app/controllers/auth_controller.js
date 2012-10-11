var locomotive = require('locomotive')
, Controller = locomotive.Controller
, passport = require('passport')
, model = require('../../lib/model')
, url = require('url')
, config = require('../../config/config.js')
, qs = require('querystring');

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
  this.next(new Error("Failed to handle request in oauth2orize middleware."));
};

AuthController.before('decide', function(req, res, next){
  var server = this.__req.app.get('oauth2server');
  server.loadTransaction(req, res, next);
});

AuthController.before('decide', function(req, res, next){
  var server = this.__req.app.get('oauth2server');

  // TODO the decision middleware passes token and state but not scope.
  // to meet the spec, scope is required anytime it's changed.
  server.decision({loadTransaction: false}, function(req, done){
    var patient = req.body.patient;
    var startedWithPatient = req.oauth2.req.patient;
    if (startedWithPatient !== undefined && startedWithPatient !== patient) {
      return done(new Error("Patient doesn't match requested patient: " + startedWithPatient + " but ended with " + patient));
    }

    var query = {server: config.baseUri};
    if (patient){
      query.patient = patient;
    }

    var r = url.parse(req.oauth2.redirectURI); 
    r.query = query;
    req.oauth2.redirectURI = url.format(r);
    done(null, {patient: patient, scope: req.oauth2.req.scope});

  })(req, res, next);
});

AuthController.requirePatientAccess = function() {
  console.log("req pat ae", this.req.authInfo);
  console.log("ensuring auth to query patient ", this.req.params.pid);
  var token = this.req.authInfo;
  if (this.req.authInfo.scope.indexOf("patient") !== -1) {
    if (this.req.authInfo.patient !== this.req.params.pid){
      return this.next("Wrong patient");
    }
  }
  this.next(null);
}
AuthController.before("requirePatientAccess", passport.authenticate('bearer', {session:false}));
AuthController.before("requirePatientAccess", function(req, res, next){
  console.log("pp comple");
});

AuthController.ensureAuthenticated = function() {
  console.log("ensuring auth to query patient ", this.req.params.pid);
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
