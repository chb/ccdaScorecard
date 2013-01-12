var common = require('../lib/common');

var rubric = module.exports = function(){};

var unitMap = require('./shared/codes').unitMap;

rubric.prototype.report = function(done){
  var ccda = this.manager.ccda;
  var vocab = this.manager.vocab;
  var report;

  vitalsStructured = common.xpath(
    ccda, 
    "//h:templateId[@root='2.16.840.1.113883.10.20.22.2.4.1']/.." + 
      "//h:templateId[@root='2.16.840.1.113883.10.20.22.4.27']/.."
  );

  var hits = [];
  var misses = [];

  if (vitalsStructured){
   vitalsStructured.forEach(function(v){

      var code = common.extractCodes(v, "./h:code", vocab)[0];

      var unit = common.xpath(v, "string(./h:value/@unit)");
      var value = common.xpath(v, "string(./h:value/@value)");

      if (!unitMap[code.code]) {
        return;
       }

      var attempt = {
        code: code,
        value:  value,
        unit: unit,
        preferred: unitMap[code.code].units
      };

      if (unitMap[code.code].units.indexOf(unit) !== -1){
        hits.push(attempt);
      } else {
        misses.push(attempt);
      }
  
   }); 
  }

  report = common.report(rubric, hits.length, hits.length+misses.length, {
    hits: hits,
    misses: misses
  }
  
  );     

  done(null, report);
};
