var assert = require("assert");
var parser = require("../lib/parser.js");
var ccd = require("../lib/ccd.js");

function wrapText(t){
  return {text: function(){return t;}};
};

describe('HL7 Date parsing', function(){
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

describe('ConceptDescriptor post-processing', function(){
  
  var lab, c;
  
  before(function() {
    lab = {
      system: "2.16.840.1.113883.5.83",
      code: "N",
      label: null,
      systemName: null
      }
    , c = new (ccd.ConceptDescriptor)();
    
    c.js = lab;
    c.cleanup();
  });

  it('should augment a simple "N" interpretation code with the "Normal" label', function(){
    assert.equal(c.js.label, "Normal");
  });

  it('should augment a ConceptDescription with a URI', function(){
    assert.ok(c.js.uri);
  });

  it('should augment a ConceptDescription with a system name', function(){
    assert.ok(c.js.systemName);
  });
});

describe('Componentry', function(){
  beforeEach(function(){
    this.c = new (ccd.ConceptDescriptor)();
  });

  it('should set shallow paths', function(){
    this.c.setJs("path", "value1");
    assert.equal(this.c.js.path, "value1");
  });


  it('should set deep paths', function(){
    this.c.setJs("a.b", 42);
    assert.equal(this.c.js.a.b, 42);
  });
});

