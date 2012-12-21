var common = require('../lib/common');

var rubric = module.exports = function(){};

rubric.prototype.report = function(done){

  var ccda = this.manager.ccda;
  var vocab = this.manager.vocab;

  var codes = common.valueSetMembership(ccda, problemCodes, valueSetOid, vocab);

  var numerator = codes.inSet.length;
  var denominator = codes.notInSet.length + numerator;

  var report = common.report(rubric, numerator, denominator);
  done(null, report);
};

var templateIds = {
  concern: "2.16.840.1.113883.10.20.22.4.3",
  problem: "2.16.840.1.113883.10.20.22.4.4"
}

var problemCodes = "//h:templateId[@root='"+templateIds.concern+"']/.."+
            "//h:templateId[@root='"+templateIds.problem+"']/.." + 
            "/h:value";

var valueSetOid = "2.16.840.1.113883.3.88.12.3221.7.4";
