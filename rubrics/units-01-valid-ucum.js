var common = require('../lib/common');
var ucum = require('./shared/ucum_parser');
var rubric = module.exports = function(){};

rubric.prototype.test = function validUcum(u, context){
  console.log("Args", arguments);
  try { ucum.parse(u); }
  catch(e){
    var err = "Invalid UCUM unit";
    this.fail(u, context, err);
  }
}

var units = "//*[@value and @unit]";

rubric.prototype.inputs = function(){
  return common.xpath(this.manager.ccda, units).map(function(u){
    console.log("units", u);
    return [common.xpath(u, "string(./@unit)"), u];
  });
}
