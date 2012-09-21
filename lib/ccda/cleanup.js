var uuid = require('node-uuid');
var config = require("../config");
var common = require("./common");
var _ = require("underscore");

var Cleanup = module.exports = {};

Cleanup.clearNulls = function(){
  if (!this.js || this.js === null) {
    return;
  }

  if ('object' === typeof this.js) {
    Object.keys(this.js).forEach(function(k) {
      if (!this.js[k] || 
          Array.isArray(this.js[k]) && (this.js[k].length === 0 || this.js[k].filter(function(v){return v.js !== null;}).length === 0) || 
            this.js[k].js === null) {
        delete this.js[k];
      }
    }, this);

    if (Object.keys(this.js).length === 0) {
      this.js = null;
    }
  }

};

function patientUri(patientId){
  return config.baseUri + "/patients/"+patientId;
};

Cleanup.assignUri = function(){
  var t= this.constructor.uriTemplate;
  this.js['_id'] = patientUri(this.topComponent.patientId)+"/"+t.category + "/" + t.type + "/"+ (uuid.v4());
};

Cleanup.fixSectionUris = function(){
  Object.keys(this.js).forEach(function(k){
    var v = this.js[k];
    if (v && v.constructor && 
        v.constructor.uriTemplate && 
          v.constructor.uriTemplate.category === "sections") {
      var parts = this.js._id.split("documents/ccda");
    v.js._id = parts[0] + "sections/" + v.constructor.uriTemplate.type + parts[1];
    }
  }, this);

};

Cleanup.assignLinks = function(){
  var links = {
    patient: patientUri(this.topComponent.patientId)
  };

  categoryMap = {
    "sections": "section",
    "organizers": "organizer",
    "documents": "document"
  };

  this.ancestors().forEach(function(a){
    var t = a.constructor.uriTemplate;
    if (!t) {
      return;
    }
    links[categoryMap[t.category] || t.category] = a.js['_id'];
  }, this);

  if (Object.keys(links).length > 0) {
    this.js['_links'] = links;
  }
};

Cleanup.resolveReference = function(){ 
  if (this.js === null){
    return; 
  }
  this.js.text = this.js.text.join("").match(/\s*(.*)\s*/)[1]
var r = this.js.reference && this.js.reference.match(/#(.*)/);
if (r && r.length == 2){
  var ret = common.xpath(this.node, "//*[@ID='"+r[1]+"']/text()").toString();
} else {
  var ret = this.js.text
}
this.js = ret || null;
};

Cleanup.augmentConcept = function(){
  if (this.js.nullFlavor !== null){
    this.js = null;
    return;
  }

  if (!OIDs[this.js.system]){
    throw "Unknown OID for system: " + this.js.system;
  }

  if (this.js.label === null){
    //TODO use db-backed code value lookup
    if (OIDs[this.js.system].table) {
      this.js.label = OIDs[this.js.system].table[this.js.code];
    }
  }

  if (this.js.systemName === null){
    this.js.systemName = OIDs[this.js.system].name;
  }
  this.js.uri = OIDs[this.js.system].uri + this.js.code;
  delete this.js.system;
};

Cleanup.renameFields = function(f){
  return function(){
    Object.keys(f).forEach(function(k){
      var tmp = this.js[f[k]];
      delete this.js[f[k]];
      this.js[k] = tmp;
    });
  };
};

Cleanup.extractFields = function(f){
  return function(){
    Object.keys(f).forEach(function(k){
      var p = f[k];
      var v = this;
      p.split('.').forEach(function(p){
        v = v[p] || v.js[p];
      });

      this.js[k] = v;
    }, this);
  };
};

Cleanup.extractAllFields = function(flist){
  return function(){
    flist.forEach(function(k){
      var tmp = this.js[k];
      delete this.js[k];
      if (tmp.js) {
        Object.keys(tmp.js).forEach(function(k){
          if (this.js[k] === undefined) {
            this.js[k] = tmp.js[k];
          }
        }, this);
      }
    }, this);
  };
};

Cleanup.ensureMutuallyExclusive = function(ps){
  return function(){
    var seen = {};
    ps.forEach(function(p){
      var newps = [];
      this.js[p].forEach(function(v,i){
        if (!seen[v.node]){
          newps.push(v);
        }
        seen[v.node] = true;
      }, this);
      this.js[p] = newps;
    }, this);
  }
};

Cleanup.remapUris = function(uriMap) {
  var Component = require("./component");
  var m = uriMap[this.js._id].matches;
  this.js._id = m && m[0] && m[0]._id || this.js._id;
  Cleanup.fixSectionUris.call(this);
  common.deepForEach(this, {
    pre: function(v){
      if (v instanceof Component){
        if (v.js && v.js._id) {
          var m = uriMap[v.js._id] && uriMap[v.js._id].matches;
          v.js._id = m && m[0] && m[0]._id || v.js._id;
          Cleanup.assignLinks.call(v);
        }
        return v.js;
      }
      return v;
    }
  });
};
