var express = require('express')
, winston = require('winston')
, poweredBy = require('connect-powered-by')
, passport = require('passport')
, https = require('https')
, fs = require('fs')
, config = require('./config');

module.exports = config;
config.launch = launch;

function launch() {
  var app =  config.app = express();
  app.set('views', __dirname + '../views');
  app.set('view engine', 'ejs');
  app.engine('ejs', require('ejs').__express);

  app.use(express.logger());
  app.use(express.favicon());

  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));

  app.enable('trust proxy');

  app.use (function(req, res, next) {
    winston.info("protocol: " + req.protocol);
    if (!req.secure && config.publicUri.match(/^https/)) {
      winston.info("redirecting to secure: " + req.originalUrl);
      return res.redirect(config.publicUri + req.originalUrl);
    }
    next();
  });

  var myBodyParser = express.bodyParser();
  app.use (function(req, res, next) {

    var complete = { mine: false, theirs: false };

    function checkDone(){
      if (complete.mine && complete.theirs){
        next();
      }
    };

    req.rawBody = '';
    req.setEncoding('utf8');

    myBodyParser(req, res, function(){
      complete.theirs = true;
      checkDone();
    });

    req.on('data', function(chunk) {
      req.rawBody += chunk;
      console.log("got some data", chunk.length, req.rawBody.length); 
    });

    req.on('end', function(){
      complete.mine = true;
      checkDone();
    })
  });

  app.use(express.bodyParser());

  app.use(function(req, res, next){
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
    res.setHeader("Access-Control-Allow-Origin", "*");
    next();
  });

  app.use('/static', express.static(__dirname + '/../public'));
  app.use(express.cookieParser('express-cookie-secret-here'));
  app.use(express.session());
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);

  require('../routes');

  app.listen(config.port);
  winston.info("launched server on port " + config.port);
};
