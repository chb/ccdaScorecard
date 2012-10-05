var times = []
function extractData() {
  times.push(new Date().getTime());
  var p = { age: {}};
  p.cholesterol = {};
  p.HDL = {};
  p.hsCRP = {};

  var get_demographics  = $.ajax({
    method: "get",
    url: SMART.server + "/patients/"+SMART.patient,
    dataType:"json"
  }).success(function(demos){

    p.givenName = {value:demos.name.givens.join(" ")};
    p.familyName= {value:demos.name.family};
    p.gender= {value:demos.gender.toLowerCase()};
    p.birthday= {value:demos.birthTime.slice(0,10)};

    p.age.value = get_age(p.birthday.value);

    if (p.age.value > 80) {
      alert('The risk score is only valid for ages less than 80 years old.\n\nShowing results based on age of 80 years;');
      p.age.value = 80;
    }
    else if (p.age.value < 45) {
      alert('The risk score is only valid for ages above 44 years old.\n\nShowing results based on age of 45 years;');
      p.age.value = 45;
    }
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

  var get_labs = $.ajax({
    method: "get",
    url: SMART.server + "/patients/"+SMART.patient + "/entries/results",
    data: {q: {"resultName.code": {"$in":["30522-7", "2093-3", "2085-9", "8470-6"]}}},
  dataType:"json"}).success(function(labs){


    var $labs = SMART.selector(labs);
    $labs.byCode("http://purl.bioontology.org/ontology/LNC/30522-7").forEach(function(hscrp){
      p.hsCRP = hscrp.physicalQuantity;
    });

    $labs.byCode("http://purl.bioontology.org/ontology/LNC/2093-3").forEach(function(cholesterol){
      p.cholesterol = cholesterol.physicalQuantity;
    });

    $labs.byCode("http://purl.bioontology.org/ontology/LNC/2085-9").forEach(function(HDL){
      p.HDL = HDL.physicalQuantity;
    });
  
    try {
       p.LDL = {value: p.cholesterol.value - p.HDL.value};
    } catch (e) { }

    p.smoker_p = {'value': false};
    p.fx_of_mi_p = {'value': false};

  });

  var get_vitals = $.ajax({
    method: "get",
    url: SMART.server + "/patients/"+SMART.patient + "/entries/vitals",
    data: {
      q: {"vitalName.uri": "http://purl.bioontology.org/ontology/LNC/8480-6"},
        sort: {"measuredAt.point": -1},
        limit: 1
    },
  dataType:"json"})
  .success(function(sbp){

    if (sbp.length === 1){
      p.sbp = sbp[0].physicalQuantity;
    }
    else {
      p.sbp = {'value': 120}
    }
  });


  var d = $.Deferred();

  $.when(get_demographics, get_vitals, get_labs)
  .then( function () {
    d.resolve(p);
  },
  function (message) {
    alert(message.data);
  });

  return d.promise();
};
