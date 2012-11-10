var express = require('express');
var passport = require('passport');
var util = require('util');

function TestStrategy(email){
  this.name='test';
 this.user = email || 'test@host.com';
};

TestStrategy.prototype.authenticate = function(req){
  this.success({_id: this.user});
};

passport.use(new TestStrategy());

module.exports = function() {
  this.use(express.errorHandler());
  passport.use(new TestStrategy());

 this._routes._http.post('/auth/test', 
    passport.authenticate('test'),
    function(req, res) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(req.user));
    }
  );


}
