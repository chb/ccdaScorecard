var common = require('../lib/common');

var rubric = module.exports = function(){};

rubric.prototype.report = function(done){
  var ccda = this.manager.ccda;
  var vocab = this.manager.vocab;

  var codes = common.valueSetMembership(ccda, labCodeXpath, valueSetOid, vocab);

  var numerator = codes.inSet.length;
  var denominator = codes.notInSet.length + numerator;

  var report = common.report(rubric, numerator, denominator, {misses: codes.notInSet});

  done(null, report);
};

var labCodeXpath = "( \
    //h:templateId[@root='2.16.840.1.113883.10.20.22.2.3']/.. | \
    //h:templateId[@root='2.16.840.1.113883.10.20.22.2.3.1']/.. \
  )\
  //h:templateId[@root='2.16.840.1.113883.10.20.22.4.2']/../\
  h:code";

// internally used value set OID surrogate
// because there's no official OID for the 
// top-2k extract
var valueSetOid = "LoincTop2000CodesUSAValueSet";
