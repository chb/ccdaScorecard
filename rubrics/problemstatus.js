var common = require('../lib/common');
var xpath = common.xpath;

var rubric = module.exports = function(){};

rubric.prototype.report = function(done){
  var ccda = this.manager.ccda;
  var concerns = xpath(ccda, xpaths.concerns);

  var numerator = 0;
  var denominator = concerns.length;

  concerns.forEach(function(concern){

    var concernStatus = concernStatusMap[xpath(concern, xpaths.concernStatusText)];
    var concernEndDate = xpath(concern, xpaths.concernDate).toString();

    // active conern with an end date == mistake!
    if (concernStatus === true && concernDate) {
      return;
    }

    var problemStatus = xpath(concern, xpaths.problemStatus).map(function(s){
      return problemStatusMap[s.value()];
    });

    if (problemStatus.length === 0) {
      return numerator++;
    }

    if (problemStatus.length !== 1){
      return;
    }
    problemStatus = problemStatus[0];

    if (concernStatus === undefined || problemStatus === undefined){
      return;
    }

    if (problemStatus !== concernStatus){
      return;
    }

    return numerator++;
  });

  var report = common.report(rubric, 
    numerator===denominator? denominator:0, denominator);

  done(null, report);
};

var templateIds = {
  concern: "2.16.840.1.113883.10.20.22.4.3",
  problem: "2.16.840.1.113883.10.20.22.4.4",
  problemStatus: "2.16.840.1.113883.10.20.22.4.6"
}

var xpaths = {
  concerns: "//h:templateId[@root='"+templateIds.concern+"']/..",
  concernStatusText: "string(h:statusCode/@code)",
  problemStatus: ".//h:templateId[@root='"+templateIds.problem+"']/.." + 
                 "//h:templateId[@root='"+templateIds.problemStatus+"']/.." + 
                 "/h:value/@displayName",
  concernDate: "./h:effectiveTime/h:high/@value"
}

var problemStatusMap = {
  "Active" : true,
  "Inactive": false,
  "Resolved": false
};

var concernStatusMap = {
  "active" : true,
  "completed" : false
}; 
