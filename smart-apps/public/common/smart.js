(function(window){
  var params = {};

  window.location.search.slice(1).split("&").forEach(function(v){
    var s = v.split("=");
    var ret = {};
    ret[s[0]] = s[1];
    $.extend(params, ret);
  });

  var SMART = window.SMART = {};

  SMART.selector = function(doc){

    var match = function(s){
      return JSONSelect.match(s, doc);
    };
    var forEach =function(s, cb){
      return JSONSelect.forEach(s, doc, cb);
    };
    var byCode = function(uri){
      return match(':has(:root > :root >  .uri:val("'+uri+'"))'); 
    };

    return {
      doc: doc,
      match: match,
      forEach: forEach,
      byCode: byCode
    };
  };

  var oauthResult = window.location.hash.match(/#(.*)/);
  oauthResult = oauthResult ? oauthResult[1] : "";
  oauthResult = oauthResult.split(/&/);

  SMART.auth = {};
  for (var i = 0; i < oauthResult.length; i++){
    var kv = oauthResult[i].split(/=/);
    SMART.auth[kv[0]] = kv[1];
  }

  SMART.patient = decodeURIComponent(params.patient);
  SMART.server = decodeURIComponent(params.server);

  window.location.hash="";

}(window));
