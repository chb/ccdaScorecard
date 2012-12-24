/*

TODO: 

 [x] Add more metrics for problemStatus agreement, problemCode<-SNOMED, smoking status
 [x] Expose histogram data via REST
 [x] Expose rubric list via REST
 [x] Expose blanker scorecard  via REST
 [x] Build a simple client providing paste + click --> report, histograms
 [x] Separate out functionality from the C-CDA receiver
 [x] Host online
 [x] Build in support for LOINC top2K codes

 [ ] Add a tree-path identifying a section/category for each rubric
 [ ] Convert from letter grades to points, per-rubric
 [ ] Add a list of "pointsFor": ["ccda-base", "smart"] } 
 [ ] Render clientside table to look more like html5test.com
 [ ] Use % rather than raw points overall! i.e. normalize to 100.
 [ ] Add "Tweet my score", like, +1 links
 [ ] Redesign client with Angular + Bootstrap
 [ ] filters in UI for 'show errors only'.

*/

module.exports = {
  report: report,
  valueSetMembership: valueSetMembership,
  xpath: xpath,
};

var DEFAULT_NS = {
  "h": "urn:hl7-org:v3",
  "xsi": "http://www.w3.org/2001/XMLSchema-instance"
}

function xpath(doc, p, ns){
  var r= doc.find(p, ns || DEFAULT_NS);
  return r;
};

function valueSetMembership(ccda, xpathExpr, expectedValueSetOid, vocabService){
  var ret = {
    inSet: [],
    notInSet: []
  };

  var xpathResult = xpath(ccda, xpathExpr);

  xpathResult.forEach(function(r){
    var code = {
      code : xpath(r, "string(@code)"),
      displayName : xpath(r, "string(@displayName)"),
      codeSystem : xpath(r, "string(@codeSystem)"),
      codeSystemName : xpath(r, "string(@codeSystemName)"),
      expectedValueSetOid: expectedValueSetOid
    };
    if (vocabService.lookup(code)){
      ret.inSet.push(code);
    } else {
      ret.notInSet.push(code)
    }
  });

  return ret;
};

var defaultPointRanges  = [
  [.8, 1],  // 3 points
  [.5, .8], // 2 points
  [0, .5],  // 1 point
];

function report(rubric, numerator, denominator, reportTemplateArgs){

  var ret = {
    doesNotApply: true,
    rubric: rubric.json.id
  };
  
  if (rubric.reportTemplate){
    ret.details = rubric.reportTemplate(reportTemplateArgs); 
  }

  if (denominator === 0) {
    return ret;
  }

  delete ret.doesNotApply;

  var slices = rubric.constructor.pointRanges || defaultPointRanges;
  var rawScore = numerator / denominator;

  ret.score = 0;
  for (var i = 0; i < slices.length; i++){
    var bottom = slices[i][0];
    var top = slices[i][1];
    var score = slices[i][2];
    if (bottom < rawScore && top >= rawScore){
      ret.score = slices.length - i;
      break;
    }
  }
  return ret;
};

