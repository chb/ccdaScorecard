var express = require('express'),
path = require('path');

module.exports = function(app) {
app.use('/apps', express.static(path.join(__dirname, 'public')));
};
