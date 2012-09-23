var async = require("async");
var util = require("util");
var common = require("./common");
var config = require("../config");
var component = require("./component");
var Cleanup = require("./cleanup");

var Writer = module.exports = function Writer(result, options){ 
  if (!(this instanceof Writer)){
    return new Writer(result, options);
  }
  this.result = result;
  this.options = options;
};

Writer.prototype.write = function(callback){
  var self = this;
  var tasks = {};
  if (this.options.m) {
    tasks.dbInserts = [function(cb){dbInserts(self.result, cb);}];
  }

  if (this.options.r) {
    tasks.remap = [function(cb){remap(self.result, cb);}];
    tasks.dbInserts && tasks.dbInserts.unshift("remap");
  }

  async.auto(tasks, function(err, resultmap){
    callback(err);
  })  
};

var remap = function(result, callback){
  // shore up our arbitrary  IDs with existing database IDs when possible.
  var remaps = { };
  var pid = result.topComponent.js._patient;

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
      if (err){
        return done(err);
      }
      if (!r.js.sourceIds || r.js.sourceIds.length === 0){
        r.matches = [];
        return done(null);
      }
      var q = {"sourceIds": {"$in": r.toJSON()['sourceIds']}};
      var matches = links.find(q); 
      matches.toArray(function(err, matches){
        matches = matches || [];
        matches.forEach(function(match){
        if (match.patient.length !== 1 || match.patient[0] !== pid) {
          return done(pid + " Patient ID mismatch for " + JSON.stringify(matches));
        }
 
        });
               r.matches = matches||[];
        done(err);
      });
    });
  };

  async.forEach(Object.keys(remaps), getExistingUris, function(err){
    Cleanup.remapUris.call(result, remaps);
    callback(err, true);
  });
};

function insertDocument(snippet, callback){
  var newlinks = snippet.getLinks();

  if (snippet.js.sourceIds) {
    newlinks.sourceIds = {$each: snippet.js.sourceIds.map(function(x){
      return x.toJSON()
    })}
  };

  function insertData(dataCallback){
    var cname = common.parseCollectionName(snippet.js._id)
    config.db.collection(cname, function(err, c){
      if (err) return callback(err);
      var sansSID = snippet.toJSON();
      delete sansSID.sourceIds;
      c.update(
        {_id: snippet.js._id},
        sansSID,
        {safe: true, upsert: true},
        function(err, res){
          if (err) return callback(err);
          dataCallback(null);
        });
    });

  };

  function insertLinks(linksCallback) {
    config.db.collection("links", function(err, links){
      if (err) linksCallback(err); 
      links.update(
        {_id: snippet.js._id},
        { $addToSet: newlinks }, 
        {upsert: true, safe: true}, 
        function(err, res){
          return linksCallback(err, snippet.js._id);
        });
    });

  };

  async.parallel([insertData, insertLinks], function(err, res){
    callback(err, true);
  });

};

function insertPatient(d, cb){
  config.db.collection("patients", function(err,collection ){
    if (err) throw err;
    var doc = d.toJSON();
    doc._id = doc._patient;
    delete doc._patient;
    doc.tokens = common.tokenizeDemographics(doc);
    collection.update({"_id":doc._id}, doc, {upsert:true});
    cb(null, "pt");
  });
};

function dbInserts(result, callback){
  var insertTasks = [];

  common.deepForEach(result, { 
    pre: function(s){
      if (s instanceof component) {
        if (s.js && s.js._id){
          insertTasks.push(function(cb){insertDocument(s, cb);});
        }
        return s.js;
      }
      return s;
    }
  });

  insertTasks.push(function(cb){
    insertPatient(result.js.demographics, cb)
  });

  async.parallel(insertTasks, function(err, r){
    callback(err, true);
  });
};


