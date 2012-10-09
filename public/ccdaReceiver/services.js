angular.module('ccdaReceiver').factory('authorization', function() {
  return {
    transactionDetails: function(tid){
      return $.ajax({
        url: baseUri + "/auth/txn-details", 
        data:{ transaction_id: tid }
      });
    }
  };
});

angular.module('ccdaReceiver').factory('patientSearch', function() {
  return {
    search: function(p){
      return $.ajax({
        url: baseUri + "/patients/all/searchByTokens", 
        data:{
          q:JSON.stringify(p.tokens),
          skip:p.skip,
          limit:p.limit
        }, dataType: "json"});
    },
    getOne: function(pid){
      return $.ajax({url:baseUri+"/patients/"+pid, dataType:"json"});
    }  
  };
});

angular.module('ccdaReceiver').factory('patient', function() {
  return {
    id: function(p){
      if (!p || !p._id) return "noval";
      return p._id.split(RegExp("/")).slice(-1)[0];
    },
    name: function(p){
      var ret = p.name.givens.join(" ");
      ret =  ret + " " + p.name.family;
      return ret;
    }
  };
});


