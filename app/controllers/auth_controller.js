var locomotive = require('locomotive')
, Controller = locomotive.Controller
, passport = require('passport');

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

AuthController.ensureAuthenticated = function() {
  console.log("ensuring auth");
  if (this.req.isAuthenticated()){
    return this.next();
  }
  this.res.render('login.ejs');
}


