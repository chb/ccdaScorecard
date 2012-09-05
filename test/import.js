var assert = require("assert");
var parser = require("../lib/parser.js");
var ccd = require("../lib/ccd.js");

function wrapText(t){
  return {text: function(){return t;}};
};

describe('Date parsing', function(){
  describe('HL7 Timestamp', function(){

    var t = wrapText("19541125")
      , parsed = parser.Processors.asTimestamp(t)
      , resolution = parser.Processors.asTimestampResolution(t);

    it('should parse a birthdate', function(){
      assert.equal(parsed.toISOString(), "1954-11-25T00:00:00Z");
    });
    it('should identify day-resolution for a birthdate', function(){
      assert.equal(resolution, "day");
    });
  });
});

describe('Lab interpretation bolstering', function(){
  var  lab = {
      system: "2.16.840.1.113883.5.83",
      code: "N",
      label: null,
      systemName: null
      }
    , c = new (ccd.ConceptDescriptor)();

  c.js = lab;
  c.cleanup();

  it('should find the appropriate lable', function(){
    assert.equal(c.js.label, "Normal");
  });
});

