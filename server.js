var locomotive = require('locomotive');
var config = require('./config/config');

var address = '0.0.0.0';
console.log("booting");
locomotive.boot(__dirname, config.env, function(err, server) {
  console.log("booted");
	if (err) { throw err; }
	server.listen(config.port, address, function() {
	  var addr = this.address();
	  console.log('listening on %s:%d', addr.address, addr.port);
	});
});
