var common = require('../lib/common');

var rubric = module.exports = function(){};

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
    var umls = vocab.lookup(c);

    if (!umls || !c.displayName || !c.codeSystemName) {
      return; // TODO: check for this error condition in a separate rubric
    }
    
    if (exceptions.indexOf(umls._id) !== -1){
      return;
    }

    tokens = c.displayName.split(/[^A-z\-\/]+/)
    .filter(function(t){return t.length > 1;})
    .map(function(t){
      return t.toLowerCase();
    });


    unmatchedTokens = tokens.filter(function(t){
      return (umls.conceptNameTokens.indexOf(t) === -1);
    });


    if (unmatchedTokens.length * 1.0 / tokens.length > .5){
      c.normalized = umls;
      console.log(tokens, tokens.length, unmatchedTokens, unmatchedTokens.lenth, "UNMATCHED");
      return misses.push(c);
    }

    return hits.push(c);
  });

  var numerator = hits.length; 
  var denominator = misses.length + numerator;

  var report = common.report(rubric, numerator, denominator, {
    hits: hits,
    misses: misses
  });

  done(null, report);
};
