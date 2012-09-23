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

  SMART.oauthToken = window.location.hash.match(/token=(.*)/)[1];
  SMART.patient = params.patient;
  SMART.server = params.server;

}(window));
