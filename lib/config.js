var mongodb = require('mongodb');
var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;
var BSON = require('mongodb').BSON;
var ObjectID = require('mongodb').ObjectID;
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
var mongoPatientsUrl = process.env.MONGOLAB_URI || generate_mongo_url(mongoPatients); 
var mongoVocabUrl = process.env.MONGOLAB_URI || generate_mongo_url(mongoVocab); 

var publicHost = process.env.publicHost || host;
var publicPort = process.env.publicPort || port;

var dbstate = new events.EventEmitter();

function dbPatients(cb){
  mongodb.connect(mongoPatientsUrl, {server: {auto_reconnect: true}}, function(err, conn){ 
    console.log("connected to mongo patients @ ", mongoPatientsUrl);
    module.exports.db = conn;
    cb(err);
  });
};

function dbVocab(cb){
  mongodb.connect(mongoVocabUrl, {server: {auto_reconnect: true}}, function(err, conn){ 
    console.log("connected to mongo patients @ ", mongoVocabUrl);
    module.exports.vocabDb = conn;
    cb(err);
  }); 
};

async.parallel([dbPatients, dbVocab], function(err){
  dbstate.emit("ready");
});


module.exports = {
  port: port,
  host: host,
  publicHost: publicHost,
  publicPort: publicPort,
  baseUri: "http://"+publicHost+":"+publicPort,
  dbstate: dbstate
};
