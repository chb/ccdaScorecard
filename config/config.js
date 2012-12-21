var mongodb = require('mongodb');
var Db = require('mongodb').Db;
var Server = require('mongodb').Server;
var events = require('events');
var async = require('async');

var port = (process.env.VMC_APP_PORT || 3000);
var host = (process.env.VCAP_APP_HOST || 'localhost');

var mongoVocab = {
  "hostname":"localhost",
  "port":27017,
  "username":"",
  "password":"",
  "name":"",
  "db":"vocab"
}

var mongoCcdaScorecard = {
  "hostname":"localhost",
  "port":27017,
  "username":"",
  "password":"",
  "name":"",
  "db":"ccdaScorecard"
}

var generate_mongo_url = function(obj){
  obj.hostname = (obj.hostname || 'localhost');
  obj.port = (obj.port || 27017);
  obj.db = (obj.db || 'test');
  if(obj.username && obj.password){
    return "mongodb://" + obj.username + ":" + obj.password + "@" + obj.hostname + ":" + obj.port + "/" + obj.db + "?safe=true";
  }
  else{
    return "mongodb://" + obj.hostname + ":" + obj.port + "/" + obj.db + "?safe=true";
  }
}
var mongoVocabUrl = process.env.MONGOLAB_VOCAB_URI || generate_mongo_url(mongoVocab); 
var mongoCcdaScorecardUrl = process.env.MONGOLAB_CCDA_SCORECARD_URI || generate_mongo_url(mongoCcdaScorecard); 

var dbstate = new events.EventEmitter();

function connectToDb(dburl, exportname){
  return function(cb){
    mongodb.connect(dburl, {
      db: {native_parser: false}, 
      server: {auto_reconnect: true}
    }, function(err, conn){ 
      module.exports.db[exportname] = conn;
      cb(err);
    });

  };
};

async.parallel([
  connectToDb(mongoVocabUrl, "vocab"),
  connectToDb(mongoCcdaScorecardUrl, "ccdaScorecard"),
],
function(err){
  if (err){
    console.log("Db connect err", err);
  }
  var db = module.exports.db;
  dbstate.emit("ready");
  dbstate.on = function(x, f){if (x==="ready") f();};
});

module.exports = {
 	env: process.env.NODE_ENV || 'development',
  port: port,
  host: host,
  publicUri: process.env.PUBLIC_URI || "http://localhost:3000",
  appServer: process.env.APP_SERVER || "http://localhost:3001/apps",
  db: {},
  dbstate: dbstate,
  shutdown: function(){
    Object.keys(module.exports.db).forEach(function(k){
      module.exports.db[k].close();
    });
  }
};
