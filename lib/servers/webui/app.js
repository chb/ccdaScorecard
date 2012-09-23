var routes = require("./routes");
var  security = require('./security');
var config = require('../../config');

module.exports = function(app){

  app.authenticatedView = function(method, route, template, options){
    app[method](route, security.ensureAuthenticated, function(req,res){
      res.render(template, {user: req.user, baseUri: config.baseUri, host: config.publicHost, port: config.publicPort});
    });
  };

  app.get('/', function(req,res){res.redirect("/ui");});
  app.authenticatedView('get', /^\/ui.*$/, 'ccdaReceiver.html');
  routes.passport(app);
}
