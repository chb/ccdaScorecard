/*

TODO: 

 [x] Add more metrics for problemStatus agreement, problemCode<-SNOMED, smoking status
 [x] Expose histogram data via REST
 [x] Expose rubric list via REST
 [x] Expose blanker scorecard  via REST
 [x] Build a simple client providing paste + click --> report, histograms
 [x] Separate out functionality from the C-CDA receiver
 [x] Host online
 [ ] Build in support for LOINC top2K codes

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

function report(rubric, numerator, denominator, reportTemplateArgs){

  var ret = {
    grade: "N/A",
    rawScore: 1,
    rubric: rubric.json.id
  };
  
  if (rubric.reportTemplate){
    ret.details = rubric.reportTemplate(reportTemplateArgs); 
  }

  if (denominator === 0) {
    return ret;
  }

  var slices = rubric.json.ranges; 
  ret.rawScore = numerator / denominator;

  for (var i = 0; i < slices.length; i++){
    var bottom = slices[i][0];
    var top = slices[i][1];
    var grade = slices[i][2];
    if (bottom <= ret.rawScore && top >= ret.rawScore){
      ret.grade = grade;
      return ret;
    }
  }
  throw new Error("value not in region " + ret.rawScore + ": " + slices);
};

