/**
* Module dependencies.
*/

var express = require('express')
, routes = require('./routes')
, user = require('./routes/user')
, http = require('http')
, passport = require('passport')
, path = require('path')
, config = require('../../config')
, security = require('./security');

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || config.webPort);
  app.set('views', __dirname + '/views');
  app.set('view options', {debug:true});
  app.set('view engine', 'ejs');
  app.engine('html', require('ejs').renderFile)
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('express-cookie-secret-here'));
  app.use(express.session());
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
  app.use(require('stylus').middleware(__dirname + '/public'));
  app.use('/static', express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.authenticatedView = function(method, route, template, options){
  app[method](route, security.ensureAuthenticated, function(req,res){
    res.render(template, {user: req.user});
  });
};

app.get('/', function(req,res){res.redirect("/ui");});
app.authenticatedView('get', /^\/ui.*$/, 'ccdaReceiver.html');

routes.passport(app);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
