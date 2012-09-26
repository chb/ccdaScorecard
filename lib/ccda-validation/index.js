var async = require("async");
var config = require("../config");

var Validate = module.exports = function(vals, callback){

  var tasks = [];

  vals = JSON.parse(JSON.stringify(vals));
  vals.forEach(function(v){
  console.log("is ", v.data.code, " in ", v.conditions.valueSetOid, "?");
    tasks.push(function(cb){
      config.db.collection("value_set_concepts", function(err, vsc){
        var q = {
          valueSetOid: v.conditions.valueSetOid,
          codeSystemOid: v.data.system,
          conceptCode: v.data.code
        }
        console.log(q);
        vsc.find(q).toArray(function(err, matches){
          console.log("codsematched",matches); 
          v.matches = matches && matches[0];
          cb(err);
        });
      });
    });
  });


  async.parallel(tasks,  function(err){
    console.log("pars done", err);
    callback(err, vals);
  });
  //callback(null, vals);

};
