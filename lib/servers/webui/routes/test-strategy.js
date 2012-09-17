/**
 * Module dependencies.
 */
var passport = require('passport')
  , util = require('util');

function Strategy(options, verify) {
  passport.Strategy.call(this);
  this.name = 'test';
}
util.inherits(Strategy, passport.Strategy);

Strategy.prototype.authenticate = function(req) {
  this.success({email:req.body['email']});
}

module.exports = Strategy;
