var fs = require("fs");
var db = require("../config/config").db;
var async = require("async");

module.exports = function(app){
  app.post('/apps/twinlist/reconcile', reconcile);
};

var properties = [
  "_id", 
  "generics", 
  "components", 
  "ingredients", 
  "treatmentIntents"
];

var exactProperties = [ "_id" ];

var reflexiveProperties = [ "generics", "components" ];


function reconcile(req, res){
  var medlists = req.body,
  allmeds = [], 
  ret = {};

  medlists.forEach(function(ml, sid){
    ml.medicationsPrescribed.forEach(function(m){
      m.sectionId = sid;
      allmeds.push(m);
    });
  });
  var codes = allmeds.map(function(m){ return m.productName.code; });

  async.waterfall([fetchProperties, calculateOverlaps, formatResponse], 
    function(err, results){
      res.setHeader("Content-type", "application/json");
      req.body.forEach(function(ml){
        console.log(ml.medicationsPrescribed.length);
      });
      res.end(JSON.stringify(results));
    }
  );

  function fetchProperties(cb){
    db.rxnorm.collection("concepts", function(err, concepts){
      concepts.find({ _id:{"$in": codes}})
      .toArray(function(err, cs){
        var data = {};
        cs.forEach(function(c){
          data[c._id] = c;
        });
        cb(err, data);
      });  
    });
  };

  function calculateOverlaps(data, cb){
    var overlaps = {};

    // Slot existing meds by each known property
    allmeds.forEach(function(m){
      properties.forEach(function(p){
        var ocat = overlaps[p] || (overlaps[p] = {});
        var d = data[m.productName.code];
        if (!d) {
          return;
        }
        var vals = Array.isArray(d[p]) ? d[p] : [d[p]];
        vals.forEach(function(v){
          var currentMatches = ocat[v] || (ocat[v] = {});
          currentMatches[m._id] = m ;
        });
        if (-1 !== reflexiveProperties.indexOf(p)){
          (ocat[d._id] || (ocat[d._id] = {}))[m._id] = m;
        }
      });
    });

    var pairs = {};
    // Assign the evidence for each potential med pair (normalized by string-sort)
    // Extract the overlapping meds in a pairwise list.
    properties.forEach(function(p){
      Object.keys(overlaps[p]).forEach(function(i){
        var group = overlaps[p][i];
        Object.keys(group).forEach(function(k1){
          var member1 = group[k1];
          Object.keys(group).forEach(function(k2){
            var member2 = group[k2];
            if (member1.sectionId >= member2.sectionId){ return; }
            var pair = pairs[member1._id] || (pairs[member1._id] = {});
            var v = pair[member2._id] || (pair[member2._id] = {m1: member1, m2: member2});
            (v[p] || (v[p] = [])).push(i);
          }); 
        });
      });
    });

    var prunedPairs = [];
    properties.forEach(function(p){
      Object.keys(pairs).forEach(function(id1){
        var member1 = pairs[id1],
        hasProperty = false;
        Object.keys(member1).forEach(function(id2){
          var pair = member1[id2];
          if(pair[p]){
            hasProperty = pair; return;
          }
        });
        if(hasProperty){
          prunedPairs.push(hasProperty);
          delete pairs[id1];
        }
      });
    });

    cb(null, prunedPairs);
  };

  function formatResponse(overlaps, cb){
    var included = {},
    uiid = 0,
    ret = {
      "reconciled": [], 
      "new_list_1": [], 
      "new_list_2": []
    };

    overlaps.forEach(function(o){
      var m1 = o.m1,
      m2=o.m2,
      mechanism = "Ingredient overlap";

      exactProperties.forEach(function(p){
        if(o[p]){
          mechanism = "Identical " + p;
        }
      });

      if (included[m1._id] || included[m2._id]){
        handleSingle(m1, ret.new_list_1);
        handleSingle(m2, ret.new_list_2);
        return;
      }
      ret.reconciled.push({
        mechanism: mechanism,
        identical: ["INGREDIENT"],
        med1: {
          units: "",
          instructions: "",
          id: uiid++,
          dose: "",
          medication_name: m1.productName.label
        },
        med2: {
          units: "",
          instructions: "",
          id:uiid++,
          dose: "",
          medication_name: m2.productName.label
        }
      });
      included[m1._id] = true;
      included[m2._id] = true;
    });

    allmeds.forEach(function(m){
      handleSingle(m, m.sectionId === 0 ? ret.new_list_1 : ret.new_list_2); 
    });

    function handleSingle(m, list){
      if (included[m._id]) {
        return;
      }
      included[m._id] = true;
      list.push({
        units: "",
        instructions: "",
        id: uiid++,
        dose: "",
        medication_name: m.productName.label
      });
    };
    cb(null, ret);
  };

};

