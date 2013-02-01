var common = require('../lib/common');
var xpath = common.xpath;

var validSmokingCodes = [
  "449868002", // Current every day smoker
  "428041000124106", // Current some day smoker
  "8517006", // Former smoker
  "266919005", // Never smoker
  "77176002", // Smoker, current status unknown
  "266927001", // Unknown if ever smoked 
  "428071000124103", //Heavy tobacco smoker
  "428061000124105" // Light tobacco smoker
];

var rubric = module.exports = function(){};

rubric.prototype.report = function(done){
  var ccda = this.manager.ccda;
  var vocab = this.manager.vocab;

  var codes = common.extractCodes(ccda, codeXpath, vocab);

  var hits = [];
  var misses = [];

  codes.forEach(function(v){
    if (!v.normalized || v.normalized.codeSystemName !== "SNOMED-CT"){
      return misses.push(v);
    }

    if (validSmokingCodes.indexOf(v.code) === -1){
      return misses.push(v);
    }

    return hits.push(v);
  }); 

  var report = common.report(rubric, hits.length, codes.length, {
    hits: hits,
    misses: misses
  });     

  done(null, report);
};

var codeXpath = "//h:templateId[@root='2.16.840.1.113883.10.22.4.78']/../h:value";
