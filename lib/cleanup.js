var Cleanup = module.exports = {};

Cleanup.clearNulls = function(){
  Object.keys(this.js).forEach(function(k) {
    if (this.js[k] === null || 
        Array.isArray(this.js[k]) && 
          this.js[k].length === 0) {
      delete this.js[k];
    }
  }, this);
};

var counter = 0;
Cleanup.assignURI = function(){
  var t= this.constructor.uriTemplate;
  this.js.uri = "http://assigned.uri/"+t.category + "/" + t.type + "/"+ (counter++);
};



