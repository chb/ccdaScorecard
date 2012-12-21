/*

TODO: 

 [x] Add more metrics for problemStatus agreement, problemCode<-SNOMED, smoking status
 [x] Expose histogram data via REST
 [x] Expose rubric list via REST
 [x] Expose blanker scorecard  via REST
 [x] Build a simple client providing paste + click --> report, histograms
 [ ] Separate out functionality from the C-CDA receiver
 [ ] Host online

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
      system : xpath(r, "string(@codeSystem)"),
      expectedValueSet: expectedValueSetOid
    };
    if (vocabService.lookup(code)){
      ret.inSet.push(code);
    } else {
      ret.notInSet.push(code)
    }
  });

  return ret;
};

function report(rubric, numerator, denominator){

  var ret = {
    grade: "N/A",
    rawScore: 1,
    rubric: rubric.json.id
  };
  
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

