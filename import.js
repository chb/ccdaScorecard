var lxml = require("libxmljs");
var ccda = require('./ccd');
var fs = require("fs");
var util = require("util");

var argv = require('optimist')
  .usage('Convert a CCDA to JSON.\nUsage: $0')
  .demand('f')
  .alias('f', 'file')
  .describe('f', 'CCDA file to load')
  .argv

var src = fs.readFileSync(argv.f);

var xml = lxml.parseXmlString(src);
var result = ccda.import(xml);
console.log(JSON.stringify(result, null,2));
