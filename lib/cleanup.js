var uuid = require('node-uuid');
var config = require("./config");
var common = require("./common");

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

function patientUri(patientId){
	return config.baseUri + "/patients/"+patientId;
};

Cleanup.assignUri = function(){
  var t= this.constructor.uriTemplate;
  this.js['_id'] = patientUri(this.topComponent.patientId)+"/"+t.category + "/" + t.type + "/"+ uuid.v4();
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
  var r = this.js.reference.match(/#(.*)/);
  if (r.length == 2){
  console.log("matched ref", r[1]);
    this.js.reference = common.xpath(this.node, "//*[@ID='"+r[1]+"']/text()").toString();
    console.log("As", this.js.reference);
  } else {
    delete this.js.reference;
  }
};

Cleanup.augmentConcept = function(){
    if (this.js.label === null){
      this.js.label = OIDs[this.js.system].table[this.js.code];
    }
    if (this.js.systemName === null){
      this.js.systemName = OIDs[this.js.system].name;
    }
    console.log("sys: ", this.js.system)
    console.log(this.js);
    this.js.uri = OIDs[this.js.system].uri + this.js.code;
    delete this.js.system;
  }
