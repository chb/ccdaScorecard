var common = require('../lib/common');

var rubric = module.exports = function(){};

rubric.prototype.report = function(done){
  var ccda = this.manager.ccda;
  var vocab = this.manager.vocab;

  var codes = common.valueSetMembership(ccda, medCodeXpath, recommendedValueSets, vocab);

  var numerator = codes.inSet.length;
  var denominator = codes.notInSet.length + numerator;

  console.log(codes.notInSet, "missed meds");

  var report = common.report(rubric, numerator, denominator, {
    hits: codes.inSet, 
    misses: codes.notInSet
  });

  done(null, report);
};

var medCodeXpath = "//h:templateId[@root='2.16.840.1.113883.10.20.22.2.1.1']/../" + 
  "h:entry/h:substanceAdministration/"+
  "h:templateId[@root='2.16.840.1.113883.10.20.22.4.16']/../" + 
  "h:consumable/h:manufacturedProduct/" + 
  "h:manufacturedMaterial/h:code";

var recommendedValueSets = [
  //  Unofficial SMART recommendation
  "RxNorm Generic Clinical Drug",
  "RxNorm Branded Clinical Drug"
];
