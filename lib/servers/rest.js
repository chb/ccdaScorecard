var CCDAWriter = require("../ccda/writer");
var ccda = require('../ccda/ccd');
var config = require('../config');

module.exports = function(app)
{
  var config = require("../config");
  var base = config.baseUri;

  function parseSort(s){
    var ret = {};
    Object.keys(s).forEach(function(k){
      ret[k] = parseInt(s[k]);
    });
    return ret;
  }

  //TODO: DRY the responses!
  var AllDocs = function(collection, p, req, res){
    console.log("alldocs", JSON.stringify(p, null, " "));
    var q=p.q, limit=p.limit, sort=p.sort, skip=p.skip;



    config.db.collection(collection, function(err, collection) {
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
    config.db.collection(collection, function(err, collection) {
      console.log("onedoc: " + JSON.stringify(uri));
      collection.findOne({"_id": uri}, function(err, doc){
        res.setHeader("Content-type", "application/json");
        res.send(JSON.stringify(doc, null, "  "));
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
    AllDocs("patients", {q:match, limit:limit, sort:{'name.family':1}, skip:skip},req, rs);
  });

  app.get('/patients/:pid/:collection/:subcollection/:id/links', function(req, rs) {
    OneDoc("links", (base+req.url).match(/(.*)\/links$/)[1], req, rs);
  });


  app.get('/patients/:pid/:collection/:subcollection', function(req, rs) {
    console.log("||"+req.query.q+"||");

    var q = req.query.q || {};

    if (req.params.pid !== ALL){
      q = {"$and": [{"_patient": base+"/patients/"+req.params.pid}, q]};
    }
    var limit = parseInt(req.query.limit) || 0;
    var skip = parseInt(req.query.skip) || 0;
    var sort = req.query.sort || {};

    AllDocs(req.params.collection+"_"+req.params.subcollection, {q:q, limit: limit, skip: skip, sort: sort}, req, rs);
  });

  app.get('/patients/:pid/:collection/:subcollection/:id', function(req, rs) {
    OneDoc(req.params.collection+"_"+req.params.subcollection, base+req.url, req, rs);
  });

  app.get('/patients/:pid', function(req, rs) {
    OneDoc("patients", base+req.url, req, rs);
  });



app.post('/patients/:pid/documents/ccda', function(req, res) {
    var p = {
       p: req.params.pid,
       r: req.query.r || true,
       m: req.query.m || true
    },
       lxml = require("libxmljs"),
       xml = lxml.parseXmlString(req.rawBody),
       result = ccda.import(p.p, xml);


  var w = new CCDAWriter(result, p);
  w.write(function(err){
    if (err) throw err;
    config.db.close();
    res.setHeader("Content-type", "application/json");
    res.end(JSON.stringify(result, null, "  "));
  });
  });
}
