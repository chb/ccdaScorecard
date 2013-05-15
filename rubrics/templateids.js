var common = require('../lib/common');
var rubric = module.exports = function(){};
var templates = require('./shared/templates.json');

rubric.prototype.report = function(done){

  var ccda = this.manager.ccda;
  var vocab = this.manager.vocab;
  var mistakes = {};

  templates.forEach(function(t){

    var oldIds = t.old.map(function(id){
      return "//h:templateId[ @root='"+id+"' ]";
    }).join(" | "),
    oldpath = oldIds;
    olds = common.xpath(ccda, oldpath),
    newPath = t.new.map(function(id){
      return " ../h:templateId[@root='"+id+"']";
    }).join(" | ");

    olds && olds.forEach(function(oldNode){
      var rescued = common.xpath(oldNode, newPath);
      if (rescued.length === 0){
        var badId = common.xpath(oldNode, "string(./@root)");

      console.log("did news");
        if (!mistakes[badId]){
          mistakes[badId] = [];
        }
        mistakes[badId].push({badId: badId, goodIds: t.new});
      }
    });
  });

  var denominator = templates.length;
  var numerator = Object.keys(mistakes).length ? 0 : denominator;
  var report = common.report(rubric, numerator, denominator, {
    misses: mistakes
  });

  done(null, report);
};
