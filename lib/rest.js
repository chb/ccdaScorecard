var config = require("./config");
var express = require('express');

var db = config.db;
var base = config.baseUri;

var app = express();

var AllDocs = function(collection, q, callback){
  db.collection(collection, function(err, collection) {
    console.log("Q: " + JSON.stringify(q));
    collection.find(q).toArray(function(err, doc){
      callback(err, doc);
    })
  });
}

var OneDoc = function(collection, uri, callback){
  db.collection(collection, function(err, collection) {
    collection.findOne({"_id": uri}, function(err, doc){
      callback(err, doc);
    })
  });
}

var ALL='all';
app.get('/patients/:rid/:collection/:subcollection/search', function(req, rs) {
  var q = JSON.parse(req.query.filter || "{}");

  if (req.params.rid !== ALL){
    q = {"$and": [{"_links.patient": base+"/patients/"+req.params.rid}, q]};
  }

  AllDocs(req.params.collection+"/"+req.params.subcollection, q, function(err, doc){ 
    rs.send(JSON.stringify(doc, null, "  "));
  });
});

app.get('/patients/:rid/:collection/:subcollection/:id', function(req, rs) {
  OneDoc(req.params.collection+"/"+req.params.subcollection, base+req.url, function(err, doc){ 
    rs.send(JSON.stringify(doc, null, "  "));
  })
});

app.listen(config.port);
