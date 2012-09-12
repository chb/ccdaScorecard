function deepForEach(obj, fns){
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

module.exports = {
	deepForEach: deepForEach,
  xpath: xpath
}

