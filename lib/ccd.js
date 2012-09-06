var fs = require("fs");
var util = require("util");

var Processor = require("./processor");
var OIDs = require("./oids");
var Component = require("./component");
var Cleanup = require("./cleanup");

Component.cleanupStep(Cleanup.clearNulls);

var Identifier = Component.define("Identifier")
  .fields([
            ["root","1..1", "@root"],
            ["extension","0..1", "@extension"],
          ]);
  
var ConceptDescriptor = Component.define("CD")
  .fields([
    ["label","0..1", "@displayName"],
    ["code","1..1", "@code"],
    ["system","1..1", "@codeSystem"],
    ["systemName","0..1", "@codeSystemName"],
    ["nullFlavor","0..1", "@nullFlavor"],
    ["translation","0..*", "h:translation", ConceptDescriptor],
  ])
  .cleanupStep(function(){
    if (this.js.label === null){
      this.js.label = OIDs[this.js.system].table[this.js.code];
    }
    if (this.js.systemName === null){
      this.js.systemName = OIDs[this.js.system].name;
    }
    this.js.uri = OIDs[this.js.system].uri + this.js.code;
  });


var SimpleCode = ConceptDescriptor.define("SimpleCode")
  

var Address = Component.define("Address")
  .fields([
    ["streetAddress", "1..4",   "h:streetAddressLine/text()"],
    ["city",          "1..1",   "h:city/text()"],
    ["state",         "0..1",   "h:state/text()"],
    ["zip",           "0..1",   "h:postalCode/text()"],
    ["country",       "0..1",   "h:country/text()"],
    ["use",           "0..1",   "@use"]
  ]);

var Name = Component.define("Name")
  .fields([
    ["prefix", "0..*","h:prefix/text()"],
    ["given", "1..*","h:given/text()"],
    ["family", "1..1","h:family/text()"],
    ["suffix", "0..1","h:suffix/text()"],
    ["use", "0..1", "@use"]
  ]);

var Telecom = Component.define("Telecom")
  .fields([
       ["value", "1..1","@value"],
       ["use", "0..1", "@use"]
    ]);
  
var Guardian = Component.define("Guardian")
  .fields([
            ["relation","0..1", "h:code", ConceptDescriptor],
            ["address","0..*", "h:addr", Address],
            ["name","1..*", "h:guardianPerson/h:name", Name],
            ["telecom","0..*", "h:telecom", Telecom],
           ]);

var LanguageCommunication = Component.define("LanguageCommunication")
  .fields([
       ["mode","0..1", "h:modeCode", ConceptDescriptor],
       ["proficiency","0..1", "h:proficiencyLevelCode", ConceptDescriptor],
       ["code", "1..1","h:languageCode/@code"],
       ["preferred", "1..1","h:preferenceInd/@value", Processor.asBoolean],
    ]);

var EffectiveTime = Component.define("EffectiveTime")
  .fields([
            ["point","0..1", "@value", Processor.asTimestamp],
            ["pointResolution","0..1", "@value", Processor.asTimestampResolution],
            ["low","0..1", "h:low/@value", Processor.asTimestamp],
            ["lowResolution","0..1", "h:low/@value", Processor.asTimestampResolution],
            ["high","0..1", "h:high/@value", Processor.asTimestamp],
            ["highResolution","0..1", "h:high/@value", Processor.asTimestampResolution],
           ]);
var PhysicalQuantity = Component.define("PhysicalQuantity")
  .fields([
            ["value","1..1", "@value", Processor.asFloat], 
            ["unit", "0..1", "@unit"],
    ]);

var VitalSignObservation = Component.define("VitalSignObservation")
  .templateRoot("2.16.840.1.113883.10.20.22.4.27")
  .fields([
            ["id","1..1", "h:id", Identifier],
            ["vitalName","1..1", "h:code", ConceptDescriptor],
            ["measuredAt", "1..1", "h:effectiveTime", EffectiveTime],
            ["physicalQuantity","1..1", "h:value[@xsi:type='PQ']", PhysicalQuantity],
            ["label","0..1", "h:text/h:reference/@value"],
            ["interpretations", "0..*", "h:interpretationCode[@codeSystem='2.16.840.1.113883.5.83']", ConceptDescriptor]
    ])
  .uriBuilder({
    category: "entries",
    type: "vitals"
  });


var VitalSignsOrganizer = Component.define("VitalSignsOrganizer")
  .templateRoot("2.16.840.1.113883.10.20.22.4.26")
  .fields([
            ["ids","1..*", "h:id", Identifier],
            ["vitals", "1..*", VitalSignObservation.templateXpath(), VitalSignObservation]
    ])
  .uriBuilder({
    category: "organizers",
    type: "vitals"
  });



var VitalSignsSection = Component.define("VitalSignsSection")
  .templateRoot("2.16.840.1.113883.10.20.22.2.4.1")
  .fields([
            ["name","0..1", "h:code", ConceptDescriptor],
            ["vitalOrganizers","0..*", VitalSignsOrganizer.templateXpath(), VitalSignsOrganizer],
    ])
  .uriBuilder({
    category: "sections",
    type: "vitals"
  });


var ResultObservation = Component.define("ResultObservation")
  .templateRoot("2.16.840.1.113883.10.20.22.4.2")
  .fields([
            ["ids","1..*", "h:id", Identifier],
            ["resultName","1..1", "h:code", ConceptDescriptor],
            ["measuredAt", "1..1", "h:effectiveTime", EffectiveTime],
            ["physicalQuantity","1..1", "h:value[@xsi:type='PQ']", PhysicalQuantity],
            ["label","0..1", "h:text/h:reference/@value"],
            ["interpretations", "0..*", "h:interpretationCode[@codeSystem='2.16.840.1.113883.5.83']", ConceptDescriptor]
    ])
  .uriBuilder({
    category: "entries",
    type: "results"
  });


var ResultsOrganizer = Component.define("ResultsOrganizer")
  .templateRoot("2.16.840.1.113883.10.20.22.4.1")
  .fields([
            ["ids","1..*", "h:id", Identifier],
            ["batteryName","0..1", "h:code", ConceptDescriptor],
            ["results", "1..*", ResultObservation.templateXpath(), ResultObservation]
    ])
  .uriBuilder({
    category: "organizers",
    type: "results"
  });


var ResultsSection = Component.define("ResultsSection")
  .templateRoot([
        '2.16.840.1.113883.10.20.22.2.3',
        '2.16.840.1.113883.10.20.22.2.3.1' // .1 for "entries required"
    ])
  .fields([
            ["name","0..1", "h:code", ConceptDescriptor],
            ["resultOrganizers","0..*", ResultsOrganizer.templateXpath(), ResultsOrganizer],
    ])
  .uriBuilder({
    category: "sections",
    type: "results"
  });

var Patient = Component.define("Patient")
  .fields([
      ["name",                "1..1", "h:patient/h:name", Name],
      ["maritalStatus",       "0..1", "h:patient/h:maritalStatusCode", ConceptDescriptor],
      ["religion",            "0..1", "h:patient/h:religiousAffiliationCode", ConceptDescriptor],
      ["race",                "0..1", "h:patient/h:raceCode", ConceptDescriptor],
      ["address",             "0..*", "h:addr", Address],
      ["guardian",            "0..*", "h:patient/h:guardian", Guardian],
      ["telecom",             "0..*", "h:telecom", Telecom],
      ["language",            "0..*", "h:patient/h:languageCommunication", LanguageCommunication],
      ["medicalRecordNumbers","1..*", "h:id", Identifier],
      ["gender",              "1..1", "h:patient/h:administrativeGenderCode", ConceptDescriptor],
      ["birthTime",           "1..1", "h:patient/h:birthTime/@value", Processor.asTimestamp],
      ["birthTimeResolution", "1..1", "h:patient/h:birthTime/@value", Processor.asTimestampResolution],
    ]);



var CCDA = Component.define("CCDA")
  .fields([
            ["ids", "1..*", "h:id", Identifier],
            ["demographics", "1..1", "//h:recordTarget/h:patientRole", Patient],
            ["vitals", "0..1", VitalSignsSection.templateXpath(), VitalSignsSection],
            ["results", "0..1", ResultsSection.templateXpath(), ResultsSection],
         ])
  .uriBuilder({
    category: "documents",
    type: "ccda"
  });


CCDA.prototype.run = function(node){
    var ret = this.super_.run.apply(this, arguments);
    this.cleanup(); // 1st 
    return this;
};

module.exports.import = function(xml){
  return result = new CCDA().run(xml);
};

module.exports.ConceptDescriptor = ConceptDescriptor;
