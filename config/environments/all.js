var express = require('express')
  , poweredBy = require('connect-powered-by')
  , util = require('util')
  , passport = require('passport')

module.exports = function() {
  // Warn of version mismatch between global "lcm" binary and local installation
  // of Locomotive.
  if (this.version !== require('locomotive').version) {
    console.warn(util.format('version mismatch between local (%s) and global (%s) Locomotive module', require('locomotive').version, this.version));
  }

  // Configure application settings.  Consult the Express API Reference for a
  // list of the available [settings](http://expressjs.com/api.html#app-settings).
  this.set('views', __dirname + '/../../app/views');
  this.set('view engine', 'ejs');

  // Register EJS as a template engine.
  this.engine('ejs', require('ejs').__express);

  // Override default template extension.  By default, Locomotive finds
  // templates using the `name.format.engine` convention, for example
  // `index.html.ejs`  For some template engines, such as Jade, that find
  // layouts using a `layout.engine` notation, this results in mixed conventions
  // that can cuase confusion.  If this occurs, you can map an explicit
  // extension to a format.
  /* this.format('html', { extension: '.jade' }) */

  // Register formats for content negotiation.  Using content negotiation,
  // different formats can be served as needed by different clients.  For
  // example, a browser is sent an HTML response, while an API client is sent a
  // JSON or XML response.
  /* this.format('xml', { engine: 'xmlb' }); */

  // Use middleware.  Standard [Connect](http://www.senchalabs.org/connect/)
  // middleware is built-in, with additional [third-party](https://github.com/senchalabs/connect/wiki)
  // middleware available as separate modules.
  this.use(poweredBy('Locomotive'));
  this.use(express.logger());
  this.use(express.favicon());
  this.use('/static', express.static(__dirname + '/../../public'));
  this.use (function(req, res, next) {
    req.rawBody = '';
    req.setEncoding('utf8');
    req.on('data', function(chunk) { req.rawBody += chunk });
    next();
  });
  this.use(express.bodyParser());
  this.use(function(req, res, next){
    res.setHeader("Access-Control-Allow-Origin", "*");
    next();
  });
  this.use(express.cookieParser('express-cookie-secret-here'));
  this.use(express.session());
  this.use(passport.initialize());
  this.use(passport.session());
  this.use(this.router);
  require('../../smart-apps/app.js')(this);
}
