var Processor = require("./processor");

/*
 * Parser registartion never triggering... (?) 
XDate.parsers.push(function(t){
});
*/

var DEFAULT_NS = {
  "h": "urn:hl7-org:v3",
  "xsi": "http://www.w3.org/2001/XMLSchema-instance"
}

var xpath = function(doc, p, ns){
  var r= doc.find(p, ns || DEFAULT_NS);
  return r;
};

function Parser(){};

Parser.prototype.init = function (jsPath, cardinality, xpath, component) {
  var range = cardinality.split(/\.\./);
  var lower = range[0];
  var upper = range[range.length - 1]

  this.xpath = xpath;
  this.cardinality = cardinality;

  this.required = lower === '*' || parseInt(lower) > 0;
  this.multiple = upper === '*' || parseInt(upper) > 1;

  this.jsPath = jsPath;
  this.component = component || null;
  return this;
};

Parser.prototype.run = function (parentComponent, node) {
  var subComponent = this.component
  , matches = xpath(node, this.xpath)
  , jsVal;

  jsVal = matches.map(function(match, i) {

    if (subComponent && subComponent.componentName) {
      var subTree = new subComponent().run(match);
      return subTree;
    }
    else if (subComponent) {
      return subComponent(match);
    }

    return Processor.asString(match);

  }, this);

  if (!this.multiple && jsVal.length > 1){
    throw new Error("Found cardinality `" + jsVal.length + 
                    "` when expecting " + this.cardinality + 
                    " at " + this.xpath);
  }

  if (this.required && jsVal.length == 0){
    throw new Error("Missing but required " + this.xpath);
  }

  if (!this.multiple){
    jsVal = (jsVal.length == 0 ? null : jsVal[0]);
  }

  parentComponent.setJs(this.jsPath, jsVal);

  return this;
};

module.exports = Parser;
