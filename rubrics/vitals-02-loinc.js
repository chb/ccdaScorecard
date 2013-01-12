var common = require('../lib/common');

var rubric = module.exports = function(){};

var unitMap = require('./shared/codes').unitMap;

rubric.prototype.report = function(done){
  var ccda = this.manager.ccda;
  var vocab = this.manager.vocab;

  var codeXpath = 
  "//h:templateId[@root='2.16.840.1.113883.10.20.22.2.4.1']/.." + 
    "//h:templateId[@root='2.16.840.1.113883.10.20.22.4.27']/../h:code";

  var codes = common.extractCodes(ccda, codeXpath, vocab);

  var hits = [];
  var misses = [];

  codes.forEach(function(v){
    unitMap[v.code] ? hits.push(v) : misses.push(v);
  }); 

  var report = common.report(rubric, hits.length, codes.length, {
    hits: hits,
    misses: misses
  });     

  done(null, report);
};
