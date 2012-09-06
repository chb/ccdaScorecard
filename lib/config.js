var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;
var BSON = require('mongodb').BSON;
var ObjectID = require('mongodb').ObjectID;

var host = "localhost";
var port = 27017;

db= new Db('ccda_receiver', new Server(host, port, {auto_reconnect: true}, {}));

module.exports = {
  db: db,
  baseUri: "http://localhost:3000"
};
