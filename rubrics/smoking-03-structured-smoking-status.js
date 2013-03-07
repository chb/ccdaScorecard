var common = require('../lib/common');
var xpath = common.xpath;

var rubric = module.exports = function(){};

rubric.prototype.report = function(done){
  var ccda = this.manager.ccda;
  var report;

  var good = xpath(ccda, correctSmokingObservation).length;
  var bad = xpath(ccda, wrongSmokingObservation).length;

  report = common.report(rubric, good, good+bad);

  done(null, report);
};

var wrongSmokingObservation = "//h:templateId[@root='2.16.840.1.113883.10.22.4.78']/..";
var correctSmokingObservation = "//h:templateId[@root='2.16.840.1.113883.10.20.22.4.78']/..";
