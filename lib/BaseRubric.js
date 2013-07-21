var common = require('./common');

var BaseRubric = module.exports = function(){ };

BaseRubric.prototype.runTest = function(input){
  var self = this;

  var score = {
    fail: function(){
      self.testing.numerator--;
      if (arguments.length > 0) {
        var reasons = [];
        for (var i=0; i<arguments.length; i++){
          reasons.push(arguments[i]);
        }
        self.testing.mistakes.push(reasons);
      }
    }
  }
  if (!Array.isArray(input)){
    input = [input];
  }

  this.testing.numerator++;
  this.testing.denominator++;
  var result = this.test.apply(score, input);
  return;
}

BaseRubric.prototype.report = function(done){
  this.testing = {
    numerator: 0,
    denominator: 0,
    mistakes: []
  };

  this.inputs().forEach(function(i){
    this.runTest(i); 
  }, this);

  var report = common.report(
    this.constructor,
    this.testing.numerator,
    this.testing.denominator,
    { mistakes: this.testing.mistakes }
  );

  done(null, report);
}
