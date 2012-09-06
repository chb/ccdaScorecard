var lxml = require("libxmljs");
var fs = require("fs");
var util = require("util");
var ccda = require('./lib/ccd');
var config = require("./lib/config");

var argv = require('optimist')
.usage('Convert a CCDA to JSON.\nUsage: $0')
.demand('f')
.alias('f', 'file')
.describe('f', 'CCDA file to load')
.argv

var src = fs.readFileSync(argv.f);
var xml = lxml.parseXmlString(src);
var result = ccda.import("123", xml);

config.db.open(function(err, db){
  db.collection("documents/ccdas", function(err, collection){
    console.log(err);
    console.log(result.toJSON());
    collection.insert(result.toJSON());
    config.db.close();
  });
});
