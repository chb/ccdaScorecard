var mongodb = require('mongodb');
var Db = require('mongodb').Db;
var Server = require('mongodb').Server;
var events = require('events');
var async = require('async');

var port = (process.env.VMC_APP_PORT || 3001);
var host = (process.env.VCAP_APP_HOST || 'localhost');

var mongoRxnorm = {
  "hostname":"localhost",
  "port":27017,
  "username":"",
  "password":"",
  "name":"",
  "db":"rxnorm"
}

var generate_mongo_url = function(obj){
  obj.hostname = (obj.hostname || 'localhost');
  obj.port = (obj.port || 27017);
  obj.db = (obj.db || 'test');
  if(obj.username && obj.password){
    return "mongodb://" + obj.username + ":" + obj.password + "@" + obj.hostname + ":" + obj.port + "/" + obj.db;
  }
  else{
    return "mongodb://" + obj.hostname + ":" + obj.port + "/" + obj.db;
  }
}
var mongoRxnormUrl = process.env.MONGOLAB_RXNORM_URI || generate_mongo_url(mongoRxnorm); 

var publicHost = process.env.publicHost || host;
var publicPort = process.env.publicPort || port;
var dbstate = new events.EventEmitter();

function connectToDb(dburl, exportname){
  return function(cb){
    mongodb.connect(dburl, {db: {safe: true}, server: {auto_reconnect: true}}, function(err, conn){ 
      module.exports.db[exportname] = conn;
      cb(err);
    });

  };
};

connectToDb(mongoRxnormUrl, "rxnorm")(function(err){
  dbstate.emit("ready");
  console.log("ready", mongoRxnormUrl);
  dbstate.on = function(x, f){if (x==="ready") f();};
});

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: port,
  host: host,
  publicHost: publicHost,
  publicPort: publicPort,
  baseUri: "http://"+publicHost+":"+publicPort,
  db: {},
  dbstate: dbstate,
  shutdown: function(){
    Object.keys(module.exports.db).forEach(function(k){
      module.exports.db[k].close();
    });
  }
};
