var common = require('../lib/common');

var rubric = module.exports = function(){ };

var umlsSystems = [
  "2.16.840.1.113883.6.96", // snomed ct
  "2.16.840.1.113883.6.1", // loinc
  "2.16.840.1.113883.6.88" // rxnorm
];

var exceptions = ["http://purl.bioontology.org/ontology/LNC/30954-2"]; // LOINC results section.  Or so people like to call it

rubric.prototype.report = function(done){
  var ccda = this.manager.ccda;
  var vocab = this.manager.vocab;

  var codes = vocab.sourceCodes.filter(function(c){
    return (umlsSystems.indexOf(c.codeSystem) !== -1);    
  });

  var hits = [];
  var misses = [];

  codes.forEach(function(c){
    vocab.lookup(c) ? hits.push(c) : misses.push(c);
  });

  var points = (hits.length === codes.length)  ? codes.length : 0;

  var report = common.report(rubric, points, codes.length, {
    hits: hits,
    misses: misses
  });

  done(null, report);
};
