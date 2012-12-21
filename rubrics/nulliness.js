var common = require('../lib/common');

var rubric = module.exports = function(){ };

rubric.prototype.report = function(done){
  var numCodes = common.xpath(this.manager.ccda, "//h:code").length;
  var numNulls = common.xpath(this.manager.ccda, "//@nullFlavor").length;

  var numerator = numCodes;
  var denominator = numCodes + numNulls;
  var report = common.report(rubric, numerator, denominator);

  done(null, report); 
};
