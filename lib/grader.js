var Hash = require('hashish');
var xpath = require('./common').xpath; 
var lxml = require("libxmljs");
var async = require("async");
var db = require('../config').db;
var rubrics = require('./rubrics');

/*
* Calculate a grade report for a given C-CDA.
* 
* Callback takes `(err, report)` where `report`
* is a JSON structure containing a complete report.
*
* @param {String} src
* @param {Function} done
* @api public
*/
module.exports = function gradeCcda(params, done){
  var manager = new Manager(params);

  Object.keys(rubrics).forEach(function(r){
    manager.addRubric(rubrics[r]);
  });
  manager.report(done);
};

function Vocab(codes, sourceCodes){
  this.codes = codes;
  this.sourceCodes = sourceCodes;
}

// yuck - linerar comparison across all in-memory codes :-)
// TODO replace with code lookup hash.
Vocab.prototype.lookup = function(target){

  var matches = this.codes.filter(function(c){
    return (
      c.code === target.code && 
      c.codeSystem === target.codeSystem
    );
  });

  if (matches.length > 1) {
    throw new Error("Multiple vocab matches for " + JSON.stringify(code));
  }

  if (matches.length === 0) {
    return null;
  }

  return matches[0];
};

function Manager(params){

  this.ccdaSrc = params.src;
  this.saveFlag = params.save;

  try {
    this.ccda = lxml.parseXmlString(this.ccdaSrc);
  } catch(e) {
    var emsg = e.message.replace("\n", "") + " " + JSON.stringify(e);
    throw emsg;
  }
  this.rubrics = {};
  this._auto = {};
  this._auto.vocab = [this._fetchVocab.bind(this)];
  this._auto.report = [this._report.bind(this)];
  this._auto.logger = ["report", this._logger.bind(this)];
};


/*
* Ensure that grading functions have synchronous 
* access to concept / value set membership for 
* all codes in the C-CDA document (by pre-fetching).
*/
Manager.prototype._fetchVocab = function(done, results) {

  var codeBank = {};
  var manager = this;

  var allCodes = xpath(this.ccda, "//*[boolean(./@code) and boolean(./@codeSystem)]");
    allCodes.forEach(function(c){
      var code  = xpath(c, "string(@code)");
      var displayName = xpath(c, "string(@displayName)");
      var codeSystemName = xpath(c, "string(@codeSystemName)");
      var system =  xpath(c, "string(@codeSystem)");
      var key = system + "/" + code;

      codeBank[key] = {
        code: code,
        codeSystem: system,
        codeSystemName: codeSystemName,
        displayName: displayName
      };

    });

    var codes = Object.keys(codeBank).map(function(k){return codeBank[k];});

    db.vocab.collection("concepts", function(err, concepts){
      if (err){ 
        return done(err); 
      }
      var orq = codes.map(function(c){
        return {
          "code": c.code,
          "codeSystem": c.codeSystem
        };
      });

      var q = {"$or": orq};
      concepts.find(q).toArray(function(err, vals){
        manager.vocab = new Vocab(vals, codes);
        console.log("Looked up codes: ", orq, vals.length, vals);
        done(err, vals);
      });
    });

};

// fire-and-forget logging of raw C-CDA and
// update of the overall score histograms
Manager.prototype._logger = function(done, results) {
  var manager = this;

  db.ccdaScorecard.collection("scoreStats", function(err, stats){
    if (err){ 
      return done(err); 
    }

    results.report.forEach(function(score){
      var inc = {};

      var key = score.doesNotApply ? "N/A" : score.score;
      inc["counts."+key] = 1;


      stats.update(
        {_id: score.rubric}, 
        {$inc: inc}, 
        {upsert: true}, function(err){
          if(err){
            console.log("updated scores err", err);
          }
        });
    });
  }); 

  if (manager.saveFlag){
    db.ccdaScorecard.collection("ccdas", function(err, ccdas){
      if (err){ 
        console.log("Couldn't access ccda collection", err);
        return done(err); 
      }
      ccdas.insert({raw: manager.ccdaSrc, time: new Date()}, {}, function(err){
        if(err){
          console.log("pushed doc err", err);
        }
      });
    }); 
  }

  done(null);
};

Manager.prototype._report = function(done, results) {
  var manager = this;
  var reports = [];

  this._auto["report"].slice(0,-1).forEach(function(depName){
    reports.push(results[depName]);
  });

  done(null, reports);
};

Manager.prototype.addRubric = function(rubric){
  var manager = this;

  var r = this.rubrics[rubric.json.id] = new rubric();
  r.manager = manager;

  var deps = (r.constructor.dependencies || []).slice();
  deps.unshift("vocab");
  deps.unshift("report");

  console.log("Binding");
  console.log(r.constructor.json.id, "ID bound");
  manager._addDependency("report", r.constructor.json.id+".report", r.report.bind(r));
  manager._addDependency(r.constructor.json.id+".report", "vocab");

}; 

Manager.prototype._addDependency = function(needer, needed, fn){
  if (fn) {
    this._auto[needed] = [fn];
  }

  if (!this._auto[needer]){
    throw new Error("Unknown dependency: " + needer);
  }

  this._auto[needer].unshift(needed);
};

Manager.prototype.report = function(done){
  var manager = this;

  async.auto(this._auto, function(err, results){
    done(err, results.report); 
  })
};

