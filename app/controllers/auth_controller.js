var locomotive = require('locomotive')
, winston = require('winston')
, Controller = locomotive.Controller
, passport = require('passport')
, model = require('../../lib/model')
, url = require('url')
, config = require('../../config/config.js')
, qs = require('querystring');

var AuthController = module.exports =  new Controller();

AuthController.browserid = function() {
  winston.info("did bid auth" + JSON.stringify(this.req.user));
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

AuthController.providerLaunch = function() {
  this.res.redirect('/ui/authorize?transaction_id='+this.req.oauth2.transactionID);
}

AuthController.patientLaunch = function() {
  this.res.redirect('/abbi/authorize?transaction_id='+this.req.oauth2.transactionID);
}

AuthController.findApp = function(){
  var req = this.req, 
  res = this.res, 
  next = this.__next, 
  server = this.__req.app.get('oauth2server');

  server.authorization(function(areq, done) {
    model.App.findOne({_id: areq.clientID}, function(err, app) {
      if (err) { return done(err); }
      return done(null, app, app.index);
    });
  })(req, res, next);
};

AuthController.decide = function() {
  this.next(new Error(
  "Failed to handle request in oauth2orize middleware."));
};

AuthController.before('decide', function(req, res, next){
  var server = this.__req.app.get('oauth2server');
  server.loadTransaction(req, res, next);
});

function onDecision(req, done){
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

  if (req.oauth2.scope && req.oauth2.scope.indexOf("patient") !== -1) {
    if (!patient){
      return done(new Error(
        "Scope mandates the selection of a patient; none selected."
      ));
    }
  }

  done(null, {
    patient: patient || "all", 
    scope: req.oauth2.req.scope || []
  });
}

AuthController.before('decide', function(req, res, next){
  var server = this.__req.app.get('oauth2server');

  // TODO the decision middleware passes token and state but not scope.
  // to meet the spec, scope is required anytime it's changed.
  server.decision({loadTransaction: false}, onDecision )(req, res, next);
});

AuthController.ensurePatientAccess = function() {
  winston.info("req pat ae", this.req.authInfo);
  winston.info("ensuring auth to query patient ", this.req.params.pid);
  var token = this.req.authInfo;
  if (this.req.authInfo.patient) {
    if (this.req.authInfo.patient !== this.req.params.pid){
      winston.info('wrong patietn by bearr', this.req.authInfo, this.req.params);
      return this.next(new Error("Wrong patient"));
    }
  }
  winston.info('patient access OK by bearer token');
  this.next(null);
}

AuthController.before("ensurePatientAccess", 
  passport.authenticate('oauth2Bearer', {session:false}));

AuthController.ensurePatientAuthenticated = function() {
    console.log(this.req.user);
    if (!this.req.isAuthenticated()) {
      return this.res.render('abbi/login.ejs');
    }

    if (this.req.user.roles.indexOf("patient") === -1){
      return this.res.redirect('forbidden');
    }
    return this.__next();
  }

  AuthController.ensureProviderAuthenticated = function() {
    winston.info("ensuring auth to query patient ", this.req.params.pid);
    if (this.req.isAuthenticated() ){
      return this.next();
    }
    if (this.req.isAuthenticated()){
      this.req.logOut();
    }
    this.res.render('ccda_receiver/login.ejs');
  }

  //TODO: complete
  AuthController.authorizeApp = function(){
    var app = App.findOne(this.req.app);
    var user = App.findOne(this.req.user);
  } 
