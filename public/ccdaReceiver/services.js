angular.module('ccdaReceiver').factory('authorization', function() {
  return {
    transactionDetails: function(tid){
      return $.ajax({
        url: baseUri + "/auth/txn-details", 
        data:{ transaction_id: tid }
      });
    },

    decide: function(txn, allow, params){
      var data = {transaction_id: txn.transactionID};
      if (!allow){
        data.cancel = true;
      }
      params = params || {};
      angular.extend(data, params);

      var form = "<form method='post' action='/auth/decide' id='decision'>";
      for (var k in data){
        form += "<input type='hidden' name='"+k+"' value='"+data[k]+"'>";
      }
      form += "</form>";
      angular.element("body").append(form);
      angular.element("#decision").submit();

    }
  };
});

angular.module('ccdaReceiver').factory('patientSearch', function() {
  return {
    search: function(p){
      return $.ajax({
        url: baseUri + "/internal/searchForPatients", 
        data:{
          q:JSON.stringify(p.tokens),
          skip:p.skip,
          limit:p.limit
        }, dataType: "json"});
    },
    getOne: function(pid){
      return $.ajax({url:baseUri+"/internal/getOnePatient/"+pid, dataType:"json"});
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


