var fs = require("fs");
var config = require('../config');
var db = require('../lib/db');
var model = require('../lib/model');

var loadUser = loadModel(model.User);

model.App.collection.drop();
var applist = ["bp-centiles", "cardiac-risk", "twinlist"];
applist.forEach(loadApp);

model.User.collection.drop();
var userlist =  [];

userlist.push({_id: "jmandel@gmail.com", roles: ["admin", "provider"]});
userlist.push({_id: "patient@dilute.net", roles: ["patient"], authorizedForPatients: ["1557780", "1137192"]});

userlist.forEach(loadUser);

model.Token.collection.drop();
model.Authorization.collection.drop();

function loadApp(a){
  var manifest = fs.readFileSync( __dirname + "/../smart-apps/public/" + a + "/smart_manifest.json");
  manifest = manifest.toString().replace(/{{app-root}}/g, config.appServer)
  console.log(manifest);
  var app = new model.App(JSON.parse(manifest));
  app.save();
};

function loadModel(m){
  return function(v) {
    console.log(v);
    var n = new m(v);
    n.save();
  };
};

config.dbstate.on("ready", function(){
  db.shutdown();
  config.shutdown();
});
