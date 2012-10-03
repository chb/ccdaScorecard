var mongodb = require('mongodb');
var Db = require('mongodb').Db;
var Server = require('mongodb').Server;
var events = require('events');
var async = require('async');

var port = (process.env.VMC_APP_PORT || 3000);
var host = (process.env.VCAP_APP_HOST || 'localhost');

var mongoPatients = {
  "hostname":"localhost",
  "port":27017,
  "username":"",
  "password":"",
  "name":"",
  "db":"ccda_receiver"
}

var mongoVocab = {
  "hostname":"localhost",
  "port":27017,
  "username":"",
  "password":"",
  "name":"",
  "db":"vocab"
}

var mongoRxnorm = {
  "hostname":"localhost",
  "port":27017,
  "username":"",
  "password":"",
  "name":"",
  "db":"rxnorm"
}

var mongoAuth = {
  "hostname":"localhost",
  "port":27017,
  "username":"",
  "password":"",
  "name":"",
  "db":"auth"
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
var mongoPatientsUrl = process.env.MONGOLAB_PATIENTS_URI || generate_mongo_url(mongoPatients); 
var mongoVocabUrl = process.env.MONGOLAB_VOCAB_URI || generate_mongo_url(mongoVocab); 
var mongoRxnormUrl = process.env.MONGOLAB_RXNORM_URI || generate_mongo_url(mongoRxnorm); 
var mongoAuthUrl = process.env.MONGOLAB_AUTH_URI || generate_mongo_url(mongoAuth); 

var publicHost = process.env.publicHost || host;
var publicPort = process.env.publicPort || port;

var dbstate = new events.EventEmitter();

function connectToDb(dburl, exportname){
  return function(cb){
    mongodb.connect(dburl, {server: {auto_reconnect: true}}, function(err, conn){ 
      console.log("connected to mongo  @ ", dburl);
      module.exports.db[exportname] = conn;
      cb(err);
    });

  };
};

async.parallel([
  connectToDb(mongoPatientsUrl, "patients"),
  connectToDb(mongoVocabUrl, "vocab"),
  connectToDb(mongoRxnormUrl, "rxnorm"),
  connectToDb(mongoAuthUrl, "auth"),
],
function(err){
  dbstate.emit("ready");
});

module.exports = {
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
      console.log("closed", k);
    });
  }
};
console.log(module.exports);
