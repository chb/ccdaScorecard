var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;
var BSON = require('mongodb').BSON;
var ObjectID = require('mongodb').ObjectID;

var host = "localhost";
var port = 27017;

db= new Db('ccda_receiver', new Server(host, port, {auto_reconnect: true}, {}));
db.open(function(){});

var base = "http://localhost:3000";

var express = require('express');
var app = express.createServer();

var AllDocs = function(collection, q, callback){
    db.collection(collection, function(err, collection) {
        console.log("Q: " + JSON.stringify(q));
        collection.find(q, {'_id': false}).toArray(function(err, doc){
            callback(err, doc);
        })
    });
}

var OneDoc = function(collection, uri, callback){
    db.collection(collection, function(err, collection) {
        collection.findOne({"@id": uri}, {'_id':false}, function(err, doc){
            callback(err, doc);
        })
    });
}

app.get('/records/:rid/Patient', function(req, rs) {
    OneDoc("Patient", base+req.url, function(err, doc){ 
        rs.send(JSON.stringify(doc, null, "  "));
    })
});

app.get('/records/:rid/:collection/search', function(req, rs) {
    console.log(req.query.filter);
    uq = JSON.parse(req.query.filter);
   
    q = {"$and": [{"links.patient": base+"/records/"+req.params.rid+"/Patient"}, uq]};
    AllDocs(req.params.collection, q, function(err, doc){ 
        rs.send(JSON.stringify(doc, null, "  "));
    })
});

app.get('/records/:rid/:collection/:id', function(req, rs) {
    OneDoc(req.params.collection, base+req.url, function(err, doc){ 
        rs.send(JSON.stringify(doc, null, "  "));
    })
});

app.listen(3000);
