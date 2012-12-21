var common = require('../lib/common');
var xpath = common.xpath;

var rubric = module.exports = function(){};

rubric.prototype.report = function(done){
  var ccda = this.manager.ccda;
  var report;

  var social = xpath(ccda, socialHistory).toString();
  if (social.match(/smoking/i) || social.match(/smoker/i)){
    report = common.report(rubric, 0, 1);
  } else {
    report = common.report(rubric, 1, 1);
  }

  done(null, report);
};

var templateIds = {
  socialHistoryObservation: "2.16.840.1.113883.10.20.22.4.38"
};

var socialHistory = "//h:templateId[@root='"+templateIds.socialHistoryObservation+"']/..";
