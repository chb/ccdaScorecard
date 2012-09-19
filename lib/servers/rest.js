var config = require("../config");
var express = require('express');

var db = config.db;
var base = config.baseUri;

var app = express();

app.use(function(req, res, next){
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});
//TODO: DRY the responses!
var AllDocs = function(collection, p, callback){
  var q=p.q, limit=p.limit, sort=p.sort, skip=p.skip;

  db.collection(collection, function(err, collection) {
    console.log("Q: " + JSON.stringify(q));
    var r = collection.find(q);
    if (sort) r = r.sort(sort);
    if (skip) r = r.skip(skip);
    if (limit) r = r.limit(limit);
    return r.toArray(function(err, doc){
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
  var limit = parseInt(req.query.limit) || 10;
  var skip = parseInt(req.query.skip) || 0;

  if (q.length === 0){
    return rs.end("[]");
  }

  var clauses = [];
  var match = {"$and": clauses};

  q.forEach(function(t){
    clauses.push({"tokens": {"$regex": "^"+t.toLowerCase()}});
  });

  console.log(match, limit, skip);
  AllDocs("patients", {q:match, limit:limit, sort:{'name.family':1}, skip:skip}, function(err, doc){ 
    rs.setHeader("Content-type", "application/json");
    rs.send(JSON.stringify(doc, null, "  "));
  });
});

app.get('/patients/:pid/:collection/:subcollection/search', function(req, rs) {
  var q = JSON.parse(req.query.q || "{}");

  if (req.params.pid !== ALL){
    q = {"$and": [{"_links.patient": base+"/patients/"+req.params.pid}, q]};
  }

  AllDocs(req.params.collection+"/"+req.params.subcollection, {q:q}, function(err, doc){ 
    rs.setHeader("Content-type", "application/json");
    rs.send(JSON.stringify(doc, null, "  "));
  });
});

app.get('/patients/:pid/:collection/:subcollection/:id', function(req, rs) {
  OneDoc(req.params.collection+"/"+req.params.subcollection, base+req.url, function(err, doc){ 
    rs.setHeader("Content-type", "application/json");
    rs.send(JSON.stringify(doc, null, "  "));

  })
});

app.get('/patients/:pid', function(req, rs) {
  OneDoc("patients", base+req.url, function(err, doc){ 
    rs.setHeader("Content-type", "application/json");
    rs.send(JSON.stringify(doc, null, "  "));
  })
});

app.listen(config.apiPort);
