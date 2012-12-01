(function(window){
  var params = {};

  window.location.search.slice(1).split("&").forEach(function(v){
    var s = v.split("=");
    var ret = {};
    ret[s[0]] = s[1];
    $.extend(params, ret);
  });

  var SMART = window.SMART || (window.SMART = {debug: true});

  SMART.selector = function(doc){
    return new selector(doc); 
  };

  function selector(doc){
    this.doc = doc;
  };

  selector.prototype.match = function(s){
    return JSONSelect.match(s, this.doc);
  };

  selector.prototype.forEach =function(s, cb){
    return JSONSelect.forEach(s, this.doc, cb);
  };

  selector.prototype.byCode = function(p){

    var match, clauses = [];

    function clause(v){
      clauses.push(':has( :root >  .'+v+':val("'+p[v]+'"))');
    };

    ['uri', 'systemName', 'code'].forEach(function(v){
      if (p[v]){
        clause(v);
      }
    });

    match = ':has(:root > '+clauses.join('')+' )';

    return this.match(match); 
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

  // don't expose hash in the URL while in production mode
  if (SMART.debug !== true) {
    window.location.hash="";
  }

}(window));
