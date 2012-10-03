var fs = require("fs");
var config = require('./config');

var applist = ["bp-centiles", "cardiac-risk", "twinlist"];

config.dbstate.on("ready", function(){
  config.db.auth.collection("apps", function(err, apps){
    apps.drop();
    applist.forEach(loadApp);
    function loadApp(a){
      var manifest = fs.readFileSync( __dirname + "/servers/apps/public/" + a + "/smart_manifest.json");

      var manifest = manifest.toString().replace(/{{app-root}}/g, config.baseUri + "/apps/public")
      apps.insert(JSON.parse(manifest));  
      console.log(manifest);
    }
  });
  config.shutdown();
});
