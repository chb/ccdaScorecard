var util = require("util");
var common = require("./common");
var Parser = require("./parser");
var Cleanup = require("./cleanup");

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

Component.classInit("Comonent");

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

  if (this.moods) {
    var m = this.moods.map(function(m){return "@moodCode='"+m+"'";}).join(" or ");
    ret = util.format("(%s)[%s]", ret, m);
  }

  if (this.containingChild) {
    ret = util.format("(%s)[.//h:templateId[@root='%s']]", ret, this.containingChild)
  }
  
  return ret;
};

Component.containingChildTemplate = function(t){
  this.containingChild = t;
  return this;
};


Component.withMood = function(m){
  if (!util.isArray(m)){
    m = [m];
  }
  this.moods = m;
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

  // Then clean up self 
  var stepper = this.constructor;
  while (stepper) {
    if (stepper.cleanupSteps[level]) {
      stepper.cleanupSteps[level].forEach(function(step){
        step.call(this, level);
      }, this);
    }
    stepper = stepper.super_;
  };

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
  this.constructor.parsers.forEach(function(p){
    p.run(this, node);
  }, this);
  return this;
};

Component.prototype.toString = function(){
  return JSON.stringify(this);
};

Component.prototype.toJSON = function(){
  var ret = deepForEach(this.js, {
    pre: function(o){
      if (!!o && o.toJSON) {
        return o.toJSON();
      }
      return o;
    }
  });
  return ret;
};

module.exports = Component;
