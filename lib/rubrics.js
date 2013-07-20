var fs = require('fs');
var path = require('path');
var ejs = require('ejs');
var util = require('util');
var BaseRubric = require('./BaseRubric');

/*
 * Discover rubrics on-disk.  These have a consistent format
 * index.js defining the grade function, and rubric.json
 * providing the static definition with grade cut-offs.
 */
var defaultTemplateFile = path.join(
  __dirname, '..','rubrics','partials','mistakes.ejs'
);
var defaultTemplate = fs.readFileSync(defaultTemplateFile).toString();
defaultTemplate = ejs.compile(defaultTemplate, {filename:defaultTemplateFile });

var rubricDir = path.join(__dirname, "..", "rubrics");
var rubricArray = fs.readdirSync(rubricDir)
.filter(function(d){
  return (d !== "common");
})
.filter(function(d){
  return (d.match(/\.js$/));
})
.map(function(d){

  var rubric = d.match(/(.*)\.js$/)[1];
  var ret = require(path.join(rubricDir, rubric));

  var p = ret.prototype;
  util.inherits(ret, BaseRubric);

  Object.keys(p).forEach(function(k){
    ret.prototype[k] =p[k];
  });

  ret.json = require(path.join(rubricDir, rubric+".json"));
  ret.json.id = rubric;

  var reportFile = path.join(rubricDir, rubric+".report.ejs");
  if (fs.existsSync(reportFile)) {
    var template = fs.readFileSync(reportFile).toString();
    ret.reportTemplate = ejs.compile(template, {filename: reportFile});
  }  else {
    ret.reportTemplate = defaultTemplate;
  }

  return ret;
});

module.exports = rubrics = {};
rubricArray.forEach(function(r){
  rubrics[r.json.id] = r;
});


