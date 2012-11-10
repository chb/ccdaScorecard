var locomotive = require('locomotive')
, Controller = locomotive.Controller
, config = require('../../config/config');

var AbbiController = new Controller();

AbbiController.main = function() {
  this.title = 'SMART CCDA Receiver'
  this.render({
    user: this.req.user, 
    baseUri: config.baseUri, 
    host: config.publicHost, 
    port: config.publicPort
  });
}
module.exports = AbbiController;
