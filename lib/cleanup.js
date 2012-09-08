var uuid = require('node-uuid');
var config = require("./config");
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

Cleanup.assignURI = function(){
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



