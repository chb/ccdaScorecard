var lxml = require("libxmljs");
var fs = require("fs");
var util = require("util");
var ccda = require('./ccd');
var common = require("./common");
var config = require("./config");

var argv = require('optimist')
.usage('Convert a CCDA to JSON.\nUsage: $0')
.demand('f')
.alias('f', 'file')
.describe('f', 'CCDA file to load')
.demand('p')
.alias('p', 'patient-id')
.describe('p', 'Patient ID')
.alias('m', 'mongo-db')
.describe('m', 'load result into mongdb')
.argv

var src = fs.readFileSync(argv.f);
var xml = lxml.parseXmlString(src);
var result = ccda.import(argv.p, xml);

function collection(uri){
  return uri.match(/patients\/([^\/]+)\/([^\/]+)\/([^\/]+)/).slice(-2).join("/");
}

r = result.toJSON();
console.log(JSON.stringify(r, null,"  "));

if (argv.m) {
  config.db.open(function(err, db){
    common.deepForEach(r, {
      post: function(insnippet){
        if (insnippet && insnippet['_id']){
          snippet = JSON.parse(JSON.stringify(insnippet)); // quick 'n' dirty deep-clone
          delete insnippet['_links'];
          config.db.collection(collection(snippet['_id']), function(err, collection){
            collection.insert(snippet);
          });
        }
        return insnippet;
      }});
      config.db.close();
  });
}
