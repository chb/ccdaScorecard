var async = require("async");
var config = require("../config");

var Validate = module.exports = function(vals, callback){

  var tasks = [];
  response = {};

  vals.forEach(function(v){
    var codekey = v.data.system+"#"+v.data.code;
    if (response[codekey] !== undefined) {
      return;
    }
    response[codekey] = null;

    tasks.push(function(cb){
      config.vocabDb.collection("value_set_concepts", function(err, vsc){
        var q = {
          codeSystemOid: v.data.system,
          conceptCode: v.data.code
        }
        vsc.find(q).toArray(function(err, matches){
          if (matches.length > 0){
            var newres = {};
            newres.codeSystemName = matches[0].codeSystemName; 
            newres.codeSystemConceptName = matches[0].codeSystemConceptName; 
            newres.conceptCode = matches[0].conceptCode; 
            newres.valueSetOids = matches.map(function(m){return m.valueSetOid;});
            response[codekey] = newres;
          }
          cb(err);
        });
      });
    });
  });

  async.parallel(tasks,  function(err){
    callback(err, response);
  });
};
