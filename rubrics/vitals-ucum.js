var common = require('../lib/common');

var rubric = module.exports = function(){};

var unitMap = {
  '8310-5': {units: ['Cel', '[degF]' ]},
  '8462-4': {units: ['mm[Hg]']},
  '8480-6': {units: ['mm[Hg]']},
  '8287-5': {units: ['cm', '[in_i]']},
  '8867-4': {units: ['/min', '{beats}/min']},
  '8302-2': {units: ['cm', '[in_i]']},
  '8306-3': {units: ['cm', '[in_i]']},
  '2710-2': {units: ['%']},
  '9279-1': {units: ['/min', '{breaths}/min']},
  '3141-9': {units: ['g', 'kg', '[lb_av]', '[oz_av]']},
  '39156-5 ': {units: ['kg/m2']},
  '3140-1': {units: ['m2']}
};

rubric.prototype.report = function(done){
  var ccda = this.manager.ccda;
  var report;

  vitalsStructured = common.xpath(
    ccda, 
    "//h:templateId[@root='2.16.840.1.113883.10.20.22.2.4.1']/.." + 
      "//h:templateId[@root='2.16.840.1.113883.10.20.22.4.27']/.."
  );

  console.log("individual vitals", vitalsStructured);

  var hits = 0;
  var misses = 0;

  if (vitalsStructured){
   vitalsStructured.forEach(function(v){
      var code = common.xpath(v, "string(./h:code/@code)");
      var u = common.xpath(v, "string(./h:value/@value)");
      
      console.log("a vital", v.toString(), code, u);

      if (!unitMap[code]) {
        return;
       }

      if (unitMap[code].units.indexOf(u) !== -1){
        hits++;
      } else {
        misses++;
      }
  
   }); 
  }

  report = common.report(rubric, hits, hits+misses);     

  done(null, report);
};
