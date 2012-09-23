var lxml = require("libxmljs");
var fs = require("fs");
var ccda = require('./ccd');
var config = require('../config');

var argv = require('optimist')
.usage('Convert a CCDA to JSON.\nUsage: $0')
.demand('f')
.alias('f', 'file')
.describe('f', 'CCDA file to load')
.demand('p')
.alias('p', 'patient-id')
.describe('p', 'Patient ID')
.describe('stdout', 'Output JSON to stdout')
.alias('r', 'replace-content')
.describe('r', 'Overwrite existing URIs when available')
.alias('m', 'mongo-db')
.describe('m', 'load result into mongdb')
.argv

var src = fs.readFileSync(argv.f),
xml = lxml.parseXmlString(src),
result = ccda.import(argv.p, xml);

config.dbstate.on("ready", function(){
  var CCDAWriter = require("./writer");
  var w = new CCDAWriter(result, argv);
  w.write(function(err){
    if (err) throw err;
    config.db.close();
    if (argv.stdout) {
    console.log(result.toJSON());
    }
    console.log("Finished", argv.p);
  });
});
