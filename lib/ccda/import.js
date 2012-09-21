var lxml = require("libxmljs");
var async = require("async");
var fs = require("fs");
var util = require("util");
var ccda = require('./ccd');
var dbm = require('./dbm');
var common = require("./common");
var config = require("../config");
var component = require("./component");
var Cleanup = require("./cleanup");

var argv = require('optimist')
.usage('Convert a CCDA to JSON.\nUsage: $0')
.demand('f')
.alias('f', 'file')
.describe('f', 'CCDA file to load')
.demand('p')
.alias('p', 'patient-id')
.describe('p', 'Patient ID')
.alias('m', 'mongo-db')
.describe('m', 'load result into mongdb')
.argv

var src = fs.readFileSync(argv.f);
var xml = lxml.parseXmlString(src);
var result = ccda.import(argv.p, xml);

function collection(uri){
  return uri.match(/patients\/([^\/]+)\/([^\/]+)\/([^\/]+)/).slice(-2).join("/");
}

// shore up our arbitrary  IDs with existing database IDs when possible.
var remaps = { };

common.deepForEach(result, {
  pre: function(c){
    if (c instanceof component) {
      if (c.js && c.js._id) {
        remaps[c.js._id] = c;
      }
      return c.js;
    }
    return c;
  }
});

function getExistingUris(k, done){
  var r = remaps[k];

  config.db.collection("links", function(err, links){
    if (err) throw err;
    if (!r.js.sourceIds || r.js.sourceIds.length === 0){
      r.matches = [];
      return done(null);
    }
    var q = {"sourceIds": {"$in": r.toJSON()['sourceIds']}};
    var matches = links.find(q); 
    matches.toArray(function(err, matches){
      if (err){console.log(err, q); throw err;}
      r.matches = matches||[];
      done(null);
    });
  });
};

dbm.inc();
async.forEach(Object.keys(remaps), getExistingUris, function(err){
  if (err) throw err;
  dbm.dec();
  Cleanup.remapUris.call(result, remaps);
  if (argv.m) {
    final();
  }
});

function insertSnippet(insnippet){
  if (insnippet && insnippet['_id']){
    var snippet = common.deepForEach(insnippet);
    dbm.inc();
    config.db.collection(collection(snippet['_id']), function(err, collection){
      if (err) throw err;
      collection.insert(snippet);
      dbm.dec();
    });

    var newlinks = {}

    if (snippet.sourceIds) {
      newlinks.sourceIds = {$each: snippet.sourceIds}
    };

    ['patient', 'document', 'section','organizer']
    .forEach(function(l){
      if (snippet._links[l]) {
        newlinks[l+'s'] = snippet._links[l];
      }
    });

    dbm.inc();
    config.db.collection("links", function(err, links){
      if (err) throw err;
      links.update({_id: snippet._id},{ $addToSet: newlinks }, {upsert: true});
      dbm.dec();
    });

    delete insnippet._links;
  }

  return insnippet;
};

function final(){
  var r = result.toJSON();
  common.deepForEach(r, { post: insertSnippet });
  dbm.inc();
  config.db.collection("patients", function(err,collection ){
    if (err) throw err;
    var d = r.demographics;
    d._id = d._links.patient;
    var links = d._links
    delete d._links
    d.tokens = common.tokenizeDemographics(d);
    collection.update({"_id":d._id}, d, {upsert:true});
    dbm.dec();
  });
}
