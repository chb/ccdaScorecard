var config = require('../../config/config');

var Controller = module.exports = {};

Controller.main = function(req, res, next) {
  res.render('abbi/main',
  {
    user: req.user, 
    publicUri: config.publicUri
  });
}

Controller.wrongRole = function(req, res, next) {
  res.render('abbi/wrong-role', {
    user: req.user, 
    publicUri: config.publicUri
  });
}
