function deepForEach(obj, fns){
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

	else if (['object','function'].indexOf(typeof obj) !== -1) {
		var ret = {};
		Object.keys(obj).forEach(function(k){
			ret[k] = deepForEach(obj[k], fns);
		});
	} else {
		ret = obj;
	}

	if (fns.post) {
		ret = fns.post(ret);
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
  d.birthTime && ret.push(d.birthTime.slice(0,4)) && ret.push(d.birthTime.slice(0,10));

  ret = ret.map(function(t){
    return t.toLowerCase();
  });

  return ret;
}

module.exports = {
	deepForEach: deepForEach,
  xpath: xpath,
  tokenizeDemographics: tokenizeDemographics
}

