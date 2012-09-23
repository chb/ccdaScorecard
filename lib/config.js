var mongodb = require('mongodb');
var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;
var BSON = require('mongodb').BSON;
var ObjectID = require('mongodb').ObjectID;
var events = require('events');

var port = (process.env.VMC_APP_PORT || 3000);
var host = (process.env.VCAP_APP_HOST || 'localhost');
var mongo = {
"hostname":"localhost",
"port":27017,
"username":"",
"password":"",
"name":"",
"db":"ccda_receiver"
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
var mongourl = process.env.MONGOLAB_URI || generate_mongo_url(mongo); 

var publicHost = process.env.publicHost || host;
var publicPort = process.env.publicPort || port;

var dbstate = new events.EventEmitter();
mongodb.connect(mongourl, {server: {auto_reconnect: true}}, function(err, conn){ 
console.log("connected to mongo @ ", mongourl);
    module.exports.db = conn;
    dbstate.emit("ready", conn);
}); 


module.exports = {
  port: port,
  host: host,
  publicHost: publicHost,
  publicPort: publicPort,
  baseUri: "http://"+publicHost+":"+publicPort,
  dbstate: dbstate
};


