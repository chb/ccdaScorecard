var config = require('../../config/config');

var isPlainObject = function(o){
  if (o === null) return false;
  if (o instanceof Date) return false;
  return (['object'].indexOf(typeof o) !== -1);
};

function deepForEach(obj, fns){
  var inobj = obj;
  fns = fns || {};

  if(fns.pre) {
    obj = fns.pre(obj);
  }

  var ret;
  if (obj === null) {
    ret = null;
  }
  else if (Array.isArray(obj)){
    ret = obj.map(function(elt){
      return deepForEach(elt, fns);
    });
  }
  else if (isPlainObject(obj)) {
    var ret = {};
    Object.keys(obj).forEach(function(k){
      ret[k] = deepForEach(obj[k], fns);
    });
  } else {
    ret = obj;
  }

  if (fns.post) {
    ret = fns.post(inobj, ret);
  }
  return ret;
};

var DEFAULT_NS = {
  "h": "urn:hl7-org:v3",
  "xsi": "http://www.w3.org/2001/XMLSchema-instance"
}

var xpath = function(doc, p, ns){
  var r= doc.find(p, ns || DEFAULT_NS);
  return r;
};

function tokenizeDemographics(d){
  var ret = [];
  if (d.name) {
    [].push.apply(ret, d.name.givens);
    ret.push(d.name.family);
  }


  d.addresss && d.addresses.forEach(function(a){
    a.zip && ret.push(a.zip);
    a.city && [].push.apply(ret, a.city.split(/\s/));
    a.state && ret.push(a.state);
  });

  d.medicalRecordNumbers && d.medicalRecordNumbers.forEach(function(mrn){
    mrn.root && ret.push(mrn.root);
    mrn.extension && ret.push(mrn.extension);
  });

  d.gender && ret.push(d.gender);
  Object.keys(d.birthTime).forEach(function(k){console.log(k);});
  d.birthTime && ret.push(d.birthTime.toISOString());

  ret = ret.map(function(t){
    return t.toLowerCase();
  });

  return ret;
}


function parseCollectionName(uri){
  return uri.match(/patients\/([^\/]+)\/([^\/]+)\/([^\/]+)/).slice(-2).join("_");
}

function patientUri(patientId){
  return config.publicUri + "/patients/"+patientId;
};

module.exports = {
  deepForEach: deepForEach,
  xpath: xpath,
  tokenizeDemographics: tokenizeDemographics,
  parseCollectionName: parseCollectionName,
  patientUri: patientUri
}

