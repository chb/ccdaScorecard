var fs = require("fs");
var config = require('../config/config');
var db = require('../lib/db');
var model = require('../lib/model');

var loadToken = loadModel(model.Token);
var loadUser = loadModel(model.User);

model.App.collection.drop();
var applist = ["bp-centiles", "cardiac-risk", "twinlist"];
applist.forEach(loadApp);

model.User.collection.drop();
var userlist = [{_id: "jmandel@gmail.com", roles: ["admin", "provider"]}];
userlist.forEach(loadUser);

model.Token.collection.drop();
var tokenlist = [{
 _id: "abc",
 app: "bp-centiles",
 user: "jmandel@gmail.com"
}];
tokenlist.forEach(loadToken);

function loadApp(a){
  var manifest = fs.readFileSync( __dirname + "/../smart-apps/public/" + a + "/smart_manifest.json");
  manifest = manifest.toString().replace(/{{app-root}}/g, config.baseUri + "/apps")
  var app = new model.App(JSON.parse(manifest));
  app.save();
};

function loadModel(m){
  return function(v) {
    var n = new m(v);
    n.save();
  };
};

config.dbstate.on("ready", function(){
  db.shutdown();
  config.shutdown();
});
