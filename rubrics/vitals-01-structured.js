var common = require('../lib/common');

var rubric = module.exports = function(){};

rubric.prototype.report = function(done){
  var ccda = this.manager.ccda;
  var report;
  vitalsStructured = common.xpath(ccda, "//h:templateId[@root='2.16.840.1.113883.10.20.22.2.4.1']/..");

  if (vitalsStructured && vitalsStructured.length == 1) {
    report = common.report(rubric, 1, 1);     
  } else {
    report = common.report(rubric, 0, 1);     
  }

  done(null, report);
};
