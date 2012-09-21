var util = require("util");
var common = require("./common");
var assert = require("assert");
var Parser = require("./parser");
var Processor = require("./processor");
var Cleanup = require("./cleanup");
var XDate = require("xdate");

var deepForEach = common.deepForEach;

function Component() {
  this.js = {};
  this.topComponent = this;
  this.parentComponent = this;
};

Component.classInit = function(name){
  this.cleanupSteps = {};
  this.componentName = name;
  this.needsUri = false;
};

Component.classInit("Component");

/*
* Components can define subclasses on-the-fly
*/
Component.define = function(name){

  function subcomponent() {
    subcomponent.super_.call(this); 
  }

  // class-level super_
  util.inherits(subcomponent, this);
  subcomponent.__proto__ = this;
  subcomponent.classInit(name);

  // instance-level super_ (shortcut for this.constructor.super_.prototype)
  subcomponent.prototype.super_ = this.prototype;

  return subcomponent;
};

Component.templateRoot = function(roots) {
  this.templateRoots = [];

  if (!Array.isArray(roots)) {
    roots = [roots];
  }

  roots.forEach(function(root,i){
    this.templateRoots.push(root);
  }, this);

  return this;
};

Component.prototype.ancestors = function() {
  function chainUp(c) {
    if (c.parentComponent === c){
      return [c];
    }
    var ret = [c];
    [].push.apply(ret, chainUp(c.parentComponent));
    return ret;
  };

  return chainUp(this).slice(1);
};

Component.xpath = function(){
  var ret = this.templateRoots.map(function(r){
    return util.format(".//h:templateId[@root='%s']/..", r);
  }).join(" | ");

  if (this._moods) {
    var m = this._moods.map(function(m){return "@moodCode='"+m+"'";}).join(" or ");
    ret = util.format("(%s)[%s]", ret, m);
  }

  if (this._containingChild) {
    ret = util.format("(%s)[.//h:templateId[@root='%s']]", ret, this._containingChild)
  }

  if (this._negationStatus !== undefined) {
  //TODO: handle case where we want to find 'false' and no value is present (should still match)
    var meets = util.format("(%s)[@negationInd='%s']", ret, this._negationStatus);
    if (this._negationStatus === false){
      meets += util.format(" | (%s)[not(@negationInd)]", ret);
    }
    ret = meets;
  }

  return ret;
};

Component.containingChildTemplate = function(t){
  this._containingChild = t;
  return this;
};


Component.withNegationStatus = function(t){
  this._negationStatus = t;
  return this;
};


Component.withMood = function(m){
  if (!util.isArray(m)){
    m = [m];
  }
  this._moods = m;
  return this;
};

Component.fields = function(parsers) {
  this.parsers = [];
  parsers.forEach(function(p, i){
    var np = new Parser();
    np.init.apply(np, p);
    this.parsers.push(np);
  }, this);

  return this;
};

Component.cleanupStep = function(steps, level){
  if (!Array.isArray(steps)){
    steps = [steps];
  }
  level = level || 1;
  var existing = this.cleanupSteps[level] || (this.cleanupSteps[level]=[]);
  [].push.apply(existing, steps);
  return this;
};

Component.uriBuilder = function(p){
  this.needsUri = true;
  this.uriTemplate = p;
  this.cleanupStep(Cleanup.assignUri, 1);
  this.cleanupStep(Cleanup.assignLinks, 2);
  return this;
};


Component.prototype.cleanup = function(level){
  level = level || 1;

  deepForEach(this.js, {
    pre: function(v){
      if (!!v && v.cleanup){
        v.cleanup.call(v,level);
        return null;
      }
      return v;
    }
  });
  //TODO print level+type to debug
  // Then clean up self 
  var stepper = this.constructor;
  var supers = [];
  while (stepper) {
    supers.unshift(stepper);
    stepper = stepper.super_;
  };
  supers.forEach(function(stepper){
    if (stepper.cleanupSteps[level]) {
      stepper.cleanupSteps[level].forEach(function(step){
        step.call(this);
      }, this);
    }
  }, this);
  return this;
};

Component.prototype.setJs = function(path, val) {
  var parts = path.split(/\./)
  , hook = this.js
  , i;

  for (i=0; i < parts.length - 1; i++){
    hook = hook[parts[i]] || (hook[parts[i]] = {});
  }
  hook[parts[i]] = val;

}

Component.prototype.run = function(node) {
  this.node = node;

  if (0 === this.constructor.parsers.length) {
    assert(node === null || -1 === ['object'].indexOf(typeof node));
    this.js = node;
  }

  this.constructor.parsers.forEach(function(p){
    p.run(this, node);
  }, this);
  return this;
};

Component.prototype.toString = function(){
  return JSON.stringify(this);
};

Component.prototype.toJSON = function(){
  return deepForEach(this, {
    pre: function(o){
      if (o instanceof Component) {
        return o.js;
      }
      return o;
    }
  });
};

module.exports = Component;
