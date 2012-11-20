var config = require("../config/config");
var mongoose = require('mongoose');

var opts = { db: { native_parser: false }, server: {safe: true}};

exports.auth = mongoose.createConnection(config.dburls.auth, opts);
exports.shutdown = function(){
  exports.auth.close();
};
