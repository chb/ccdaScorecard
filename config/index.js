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
  app.set('views', __dirname + '/../app/views');
  app.set('view engine', 'ejs');
  app.engine('ejs', require('ejs').__express);

  app.use(express.logger());
  app.use(express.favicon());

  app.use('/static', express.static(__dirname + '/../public'));

  app.use (function(req, res, next) {
    req.rawBody = '';
    req.setEncoding('utf8');
    req.on('data', function(chunk) { req.rawBody += chunk });
    next();
  });

  app.use(express.bodyParser());

  app.use(function(req, res, next){
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
    res.setHeader("Access-Control-Allow-Origin", "*");
    next();
  });

  app.use(express.cookieParser('express-cookie-secret-here'));
  app.use(express.session());
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);

  require('./initializers/passport');
  require('./initializers/oauth2');
  require('./initializers/routes');
  
  app.listen(config.port);
  winston.info("launched server on port " + config.port);
};
