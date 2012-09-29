var express = require('express'),
twinlist = require('./twinlist'),
path = require('path');

module.exports = function(app) {
  twinlist(app);
  app.use('/apps', express.static(path.join(__dirname, 'public')));
};
