var config = require("../config");
var express = require('express');

var db = config.db;
var base = config.baseUri;

var app = express();

app.use(function(req, res, next){
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});

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

app.get('/patients/all/searchByTokens', function(req, rs) {
  var q = JSON.parse(req.query.q || "[]");

  if (q.length === 0){
    return rs.end("[]");
  }

  var clauses = [];
  var match = {"$and": clauses};

  q.forEach(function(t){
    clauses.push({"tokens": {"$regex": t.toLowerCase()}});
  });

  AllDocs("patients", match, function(err, doc){ 
    rs.setHeader("Content-type", "application/json");
    rs.send(JSON.stringify(doc, null, "  "));
  });
});

app.get('/patients/:rid/:collection/:subcollection/search', function(req, rs) {
  var q = JSON.parse(req.query.q || "{}");

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

app.listen(config.apiPort);
