var express = require('express')
, http = require('http')
, passport = require('passport')
, path = require('path')
, config = require('./config');
var bodyParser = express.bodyParser();
var app = express();

app.configure(function(){
  app.set('port', config.port);
  app.set('views', __dirname + '/servers/webui/views');
  app.set('view options', {debug:true});
  app.set('view engine', 'ejs');
  app.use(function(req, res, next){
    res.setHeader("Access-Control-Allow-Origin", "*");
    next();
  });
  app.engine('html', require('ejs').renderFile)
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use (function(req, res, next) {
      req.rawBody = '';
      req.setEncoding('utf8');
      req.on('data', function(chunk) { req.rawBody += chunk });
      next();
  });
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('express-cookie-secret-here'));
  app.use(express.session());
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
  app.use('/static', express.static(path.join(__dirname, 'servers', 'webui', 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

require("./servers/webui/app.js")(app);
require("./servers/apps/app.js")(app);
require("./servers/rest.js")(app);
