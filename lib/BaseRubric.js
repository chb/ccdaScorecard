var common = require('./common');

var BaseRubric = module.exports = function(){ };

BaseRubric.prototype.runTest = function(input){
  var self = this;

  var score = {
    fail: function(reason){
      self.testing.numerator--;
      if (reason) {
        if (!Array.isArray(reason)){
          reason = [reason];
        }
        self.testing.mistakes.push(reason);
      }
    }
  }

  this.testing.numerator++;
  this.testing.denominator++;
  var result = this.test.call(score, input);
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
