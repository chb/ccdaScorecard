var fs = require('fs');
var path = require('path');
var ejs = require('ejs');

/*
 * Discover rubrics on-disk.  These have a consistent format
 * index.js defining the grade function, and rubric.json
 * providing the static definition with grade cut-offs.
 */

var rubricBase = path.join(__dirname, "..", "rubrics");
var rubricArray = fs.readdirSync(rubricBase)
.filter(function(d){
  return (d !== "common");
})
.filter(function(d){
  return (d.match(/\.js$/));
})
.map(function(d){
  var rubric = d.match(/(.*)\.js$/)[1];
  var ret = require(path.join(rubricBase, rubric));
  ret.json = require(path.join(rubricBase, rubric+".json"));

  var reportFile = path.join(rubricBase, rubric+".report.ejs");
  if (fs.existsSync(reportFile)) {
    var template = fs.readFileSync(reportFile).toString();
    ret.reportTemplate = ejs.compile(template);
  } 

  return ret;
});

module.exports = rubrics = {};
rubricArray.forEach(function(r){
  rubrics[r.json.id] = r;
});


