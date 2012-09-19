angular.module('ccdaReceiver').factory('patientSearch', function() {
  return {
    search: function(p){
      return $.ajax({
	      url: "http://localhost:3000/patients/all/searchByTokens", 
	      data:{
        q:JSON.stringify(p.tokens),
        skip:p.skip,
        limit:p.limit
      }, dataType: "json"});
    },
    getOne: function(pid){
      return $.ajax({url:"http://localhost:3000/patients/"+pid, dataType:"json"});
    }  
  };
});

angular.module('ccdaReceiver').factory('patient', function() {
  return {
    id: function(p){
      if (!p || !p._id) return "";
      return p._id.split(RegExp("/")).slice(-1)[0];
    }  
  };
});


