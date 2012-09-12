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
.argv

var src = fs.readFileSync(argv.f);
var xml = lxml.parseXmlString(src);
var result = ccda.import("123", xml);

function collection(uri){
	return uri.match(/patients\/([^\/]+)\/([^\/]+)\/([^\/]+)/).slice(-2).join("/");
}

config.db.open(function(err, db){
	console.log(err);
	r = result.toJSON();
	console.log("result", JSON.stringify(r, null,"  "));
	common.deepForEach(r, {
		post: function(insnippet){
			if (insnippet && insnippet['_id']){
				snippet = JSON.parse(JSON.stringify(insnippet)); // quick 'n' dirty deep-clone
				delete insnippet['_links'];
		//		config.db.collection(collection(snippet['_id']), function(err, collection){
		//			collection.insert(snippet);
		//		});
			}
			return insnippet;
		}});
		config.db.close();
});
