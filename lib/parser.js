var XDate = require("xdate");

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

var Processors = {};

Processors.asString = function(v){
     return v.text && v.text() || v.value && v.value() || null;
};

Processors.asBoolean = function(v){
  return v==='true';
};

Processors.asFloat = function(v){
  return parseFloat(Processors.asString(v));
};

Processors.asTimestamp = function(v){
  var t = Processors.asString(v);

  if (t.indexOf('-') !== -1) {
    return;
  }
  var ret = new XDate(0,0,1,0,0,0,0, true); // UTC mode
  
  if (t.length >= 4)
    ret.setFullYear(parseInt(t.slice(0,4)));
  if (t.length >= 6)
    ret.setMonth(parseInt(t.slice(4,6))-1);
  if (t.length >= 8)
    ret.setDate(parseInt(t.slice(6,8)));
  if (t.length >= 10)
    ret.setHours(parseInt(t.slice(8,10)));
  if (t.length >= 12)
    ret.setMinutes(parseInt(t.slice(10,12)));
  if (t.length >= 14)
    ret.setSeconds(parseInt(t.slice(12,14)));

  return ret;
};

Processors.asTimestampResolution =  function(v){
  var t = Processors.asString(v);

  if (t.length===4)
    return 'year';
  if (t.length===6)
    return 'month';
  if (t.length===8)
    return 'day';
  if (t.length===10)
    return 'hour';
  if (t.length===12)
    return 'minute';
  if (t.length===14)
    return 'second';
  if (t.length > 14) {
    throw new Error(util.format("unexpected timestamp length %s:%s",t,t.length));
  }

  return 'subsecond';
};

function Parser(){};
Parser.Processors = Processors;

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

    return Processors.asString(match);

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
