var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;
var BSON = require('mongodb').BSON;
var ObjectID = require('mongodb').ObjectID;

var host = "localhost";
var dbPort = 27017;
var apiPort = 3000;
var webPort = 3001;

db= new Db('ccda_receiver', new Server(host, dbPort, {auto_reconnect: true}, {}));

module.exports = {
  db: db,
  baseUri: "http://localhost:"+apiPort,
  apiPort: apiPort,
  webPort: webPort
};
