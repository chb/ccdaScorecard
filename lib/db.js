var config = require("../config/config");
var mongoose = require('mongoose');

exports.auth = mongoose.createConnection(config.dburls.auth, {safe: true});
exports.shutdown = function(){
  exports.auth.close();
};
