var locomotive = require('locomotive')
, winston = require('winston')
, Controller = locomotive.Controller
, passport = require('passport')
, model = require('../../lib/model')
, url = require('url')
, config = require('../../config')
, qs = require('querystring');

var app = config.app;
var oauthServer = app.get('oauth2server');

var Controller =  module.exports = {};
Controller.needLogin = function(view){
  return function(req, res, next){
    if (!req.user) {
      return res.render(view);
    }
    next();
  };
};

Controller.browseridresponse = function(req, res, next) {
  winston.info("did bid auth" + JSON.stringify(req.user));
  res.json(JSON.stringify(req.user));
};

Controller.logout = function(req, res, next) {
  req.logOut();
  res.redirect('/');
}

Controller.getOAuth2Transaction = [
  oauthServer.loadTransaction,
  function(req, res, next){
    res.json(req.oauth2);
  }
];


Controller.launch = function(view) {
  return [
    findApp,
    function(req, res, next) {
      res.redirect(view + '?transaction_id='+req.oauth2.transactionID);
    }
  ];
};

var findApp = oauthServer.authorization(function(areq, done) {
    model.App.findOne({_id: areq.clientID}, function(err, app) {
      if (err) { return done(err); }
      return done(null, app, app.index);
    });
  });

Controller.decide = [
  oauthServer.loadTransaction,
  oauthServer.decision({loadTransaction: false}, onDecision)
];

function onDecision(req, done){
  var patient = req.body.patient;
  var startedWithPatient = req.oauth2.req.patient;

  if (startedWithPatient !== undefined && startedWithPatient !== patient) {
    return done(new Error("Patient doesn't match requested patient: " + startedWithPatient + " but ended with " + patient));
  }

  var query = {server: config.publicUri};
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
};

Controller.tokenHasPatientAccess = [
  passport.authenticate('oauth2Bearer', {session:false}),
  function(req, res, next) {

    winston.info("req pat ae"+ req.authInfo);
    winston.info("ensuring auth to query patient "+ req.params.pid);

    var token = req.authInfo;
    if (req.authInfo.patient) {
      if (req.authInfo.patient === req.params.pid){
        return next();
      }
    }
    else {
      if (req.user.roles.indexOf("provider") !== -1){
        return next();
      }
      if (req.user.authorizedForPatients && 
        req.user.authorizedForPatients.indexOf(req.params.pid) !== -1) {
          return next();

        }
    }
    winston.info('NO patient access by bearer token');
    return next(new Error("Wrong patient"));
  }
];

Controller.needPatientAccess = function(req, res, next) {
  winston.info("ensuring auth to query patient "+ req.params.pid);

  if (req.user.roles.indexOf("provider") !== -1) {
    return next();
  }

  if (req.user.roles.indexOf("patient") !== -1){
    if (req.user.authorizedForPatients && 
      req.user.authorizedForPatients.indexOf(req.params.pid) !== -1) {
        return next();
      }
      return next(new Error("no access to patient" + req.params.pid));
  }

  return next(new Error("no valid user roles"));
};

Controller.ensurePatientAuthenticated = function(req, res, next) {
  console.log(req.user);
  if (!req.isAuthenticated()) {
    return res.render('abbi/login.ejs');
  }

  if (req.user.roles.indexOf("patient") === -1){
    return res.redirect('forbidden');
  }
  return next();
};

Controller.needProvider = function(view){
  return function(req, res, next) {
    winston.info("ensuring auth to query patient ", req.params.pid);
    if (req.isAuthenticated() && req.user.roles.indexOf("provider") !== -1){
      return next();
    }
    res.render(view);
  };
};
