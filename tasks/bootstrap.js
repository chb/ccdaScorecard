var fs = require("fs");
var config = require('../config/config');
var db = require('../lib/db');
var model = require('../lib/model');

var applist = ["bp-centiles", "cardiac-risk", "twinlist"];

model.App.collection.drop();
applist.forEach(loadApp);

function loadApp(a){
  var manifest = fs.readFileSync( __dirname + "/../smart-apps/public/" + a + "/smart_manifest.json");
  manifest = manifest.toString().replace(/{{app-root}}/g, config.baseUri + "/apps")
  var app = new model.App(JSON.parse(manifest));
  app.save();
};

config.dbstate.on("ready", function(){
  db.shutdown();
  config.shutdown();
});
