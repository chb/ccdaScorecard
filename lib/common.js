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

module.exports = {
	deepForEach: deepForEach
}

