var passport = require('passport')
, config = require('../../config')
, db = config.db
, CCDAWriter = require("../../lib/ccda/writer")
, ccda = require('../../lib/ccda/ccd');

var base = config.baseUri;
var Controller =  module.exports = {};

function parseSort(s){
  var ret = {};
  Object.keys(s).forEach(function(k){
    ret[k] = parseInt(s[k]);
  });
  return ret;
}

//TODO: Move to some model later
var AllDocs = function(collection, p, req, res){
  console.log("alldocs", JSON.stringify(p, null, " "));
  var q=p.q, limit=p.limit, sort=p.sort, skip=p.skip;

  db.patients.collection(collection, function(err, collection) {
    var r = collection.find(q);
    if (sort) r = r.sort(parseSort(sort));
    if (skip) r = r.skip(skip);
    if (limit) r = r.limit(limit);
    r.toArray(function(err, doc){
      res.setHeader("Content-type", "application/json");
      console.log(doc && doc.length  +  "elements");
      res.send(JSON.stringify(doc, null, "  "));
    })
  });
}

var OneDoc = function(collection, uri, req, res){
  db.patients.collection(collection, function(err, collection) {
    console.log("onedoc: " + JSON.stringify(uri));
    collection.findOne({"_id": uri}, function(err, doc){
      res.setHeader("Content-type", "application/json");
      res.send(JSON.stringify(doc, null, "  "));
    })
  });
}

var ALL='all';


Controller.raw = function(req, res, next) {
  var uri = (base+req.url).match(/(.*)\/raw$/)[1];
  db.patients.collection("raw", function(err, collection) {
    console.log("rawdoc: " + JSON.stringify(uri));
    collection.findOne({"_id": uri}, function(err, doc){
      res.setHeader("Content-type", "text/xml");
      res.send(doc.xml);
    });
  });
};

Controller.entries = function(req, res, next) {
  console.log("||"+req.query.q+"||");

  var q = req.query.q || {};

  if (req.params.pid !== ALL){
    q = {"$and": [{"_patient": base+"/patients/"+req.params.pid}, q]};
  }
  var limit = parseInt(req.query.limit) || 0;
  var skip = parseInt(req.query.skip) || 0;
  var sort = req.query.sort || {};

  AllDocs(req.params.collection+"_"+req.params.subcollection, {q:q, limit: limit, skip: skip, sort: sort}, req, res);
};

Controller.document = function(req, res, next) {
  var p = {
    p: req.params.pid,
    r: req.query.r || true,
    m: req.query.m || true
  },
  lxml = require("libxmljs"),
  xml = lxml.parseXmlString(req.rawBody);

  ccda.import(p.p, xml, function(err, result){
    w = new CCDAWriter(result, p);
    w.write(function(err){
      if (err) throw err;
      res.setHeader("Content-type", "application/json");
      res.end(JSON.stringify(result, null, "  "));
    });
  });
};
Controller.entry = function(req, res, next) {
  OneDoc(req.params.collection+"_"+req.params.subcollection, base+req.url, req, res);
};
Controller.demographics = function(req, res, next) {
  OneDoc("patients", base+'/patients/'+req.params.pid, req, res);
};

Controller.links = function(req, res, next) {
  OneDoc("links", (base+req.url).match(/(.*)\/links$/)[1], req, res);
};

Controller.searchByTokens = function(req, res, next) {
  var q = JSON.parse(req.query.q || "[]");
  var limit = parseInt(req.query.limit) || 10;
  var skip = parseInt(req.query.skip) || 0;

  if (q.length === 0){
    return res.json("[]");
  }

  var clauses = [];
  var match = {"$and": clauses};

  q.forEach(function(t){
    clauses.push({"tokens": {"$regex": "^"+t.toLowerCase()}});
  });

  console.log(match, limit, skip);
  AllDocs("patients", {q:match, limit:limit, sort:{'name.family':1}, skip:skip},req, res);
}
