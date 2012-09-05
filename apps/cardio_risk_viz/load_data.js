function extractData() {
var times = []
times.push(new Date().getTime());

	var index = {};
	var doIndex = function(v) {
		if (!($.isArray(v) || $.isPlainObject(v))) {
			return;
		}
		if ( v.uri ) {
			(index[v.uri] || (index[v.uri]=[])).push( v );
		}
		if (v.code && v.code.uri) {
			(index[v.code.uri] || (index[v.code.uri]=[])).push( v );
		}
	for (var k in v) {
	   var s = v[k];
	   doIndex(s);
	};
	
		
	};
	doIndex(SMART.record.json);
	times.push(new Date().getTime());
	console.log(times[1]-times[0]);
	console.log(index);
	var p = { age: {}};

	SMART.record.forEach(".demographics .gender .code", function(g){
			p.gender = {value: (g == 'M' ? 'male' : 'female')};
			});

	SMART.record.forEach(".demographics", function(d){
			p.givenName = {value:d.name.given[0]};
			p.familyName = {value:d.name.family};
			p.birthday = {value:d.birthTime};
			});

	var get_age = function(dob_string){
		var dob = new Date(dob_string);
		var today = new Date();
		var db = new Date(dob_string);

		if (isNaN(dob)) { // IE Date constructor doesn't parse ISO-8601 -JCM
			dob_string = dob_string.split("-");
			var dob = new Date();
			dob.setFullYear(dob_string[0], dob_string[1]-1, dob_string[2]);
			var db = new Date();
			db.setFullYear(dob_string[0], dob_string[1]-1, dob_string[2]);
		}

		var cy = today.getFullYear();
		var by = dob.getFullYear();
		db.setFullYear(cy);
		var adj = (today-db<0) ? 1 : 0;
		return cy - by - adj;
	}

	p.age.value = get_age(p.birthday.value);

	if (p.age.value > 80) {
		alert('The risk score is only valid for ages less than 80 years old.\n\nShowing results based on age of 80 years;');
		p.age.value = 80;
	}
	else if (p.age.value < 45) {
		alert('The risk score is only valid for ages above 44 years old.\n\nShowing results based on age of 45 years;');
		p.age.value = 45;
	}


	var by_code = function(uri){
	  return SMART.record.match(':has(:root > :root > .uri:val("'+uri+'"))');
	};


	p.hsCRP = by_code("http://purl.bioontology.org/ontology/LNC/30522-7")[0].physicalQuantity;
	p.cholesterol = by_code("http://purl.bioontology.org/ontology/LNC/2093-3")[0].physicalQuantity;

	    p.HDL = by_code("http://purl.bioontology.org/ontology/LNC/2085-9")[0].physicalQuantity;

	p.sbp = {'value': 120}

	p.sbp = by_code("http://purl.bioontology.org/ontology/LNC/8480-6").sort(
		function(a,b){
			return b.physicalQuantity.value - a.physicalQuantity.value;
		})[0].physicalQuantity;

	p.LDL = {value: p.cholesterol.value - p.HDL.value};
	p.smoker_p = {'value': false}
	p.fx_of_mi_p = {'value': false}
	return p;
};
