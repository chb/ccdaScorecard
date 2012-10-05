process.env.MONGOLAB_PATIENTS_URI = "mongodb://localhost:27017/patients_test";

var assert = require("assert");
var Processor = require("../lib/ccda/processor.js");
var ccda = require("../lib/ccda/ccd.js");
var fs = require("fs");
var config = require("../config/config");
var CCDAWriter = require("../lib/ccda/writer");

function wrapText(t){
  return {text: function(){return t;}};
};

describe('HL7 Date parsing', function(){
  var t = wrapText("19541125")
  , parsed = Processor.asTimestamp(t)
  , resolution = Processor.asTimestampResolution(t);

  it('should parse a birthdate', function(){
    assert.equal(parsed.toISOString(), "1954-11-25T00:00:00.000Z");
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
      systemName: null,
      nullFlavor: null
    }
    , c = new (ccda.ConceptDescriptor)();

    c.js = lab;
    c.cleanup(1);
    c.cleanup("paredown");
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
    this.c = new (ccda.ConceptDescriptor)();
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

function parseDoc(src, options, done){
  ccda.import("123", src, options, function(err, result) {
    assert.equal(err, null);
    done(null, result);
  });
};
function insertDoc(src, options, done){
  parseDoc(src, options, function(err, result){
    var w = new CCDAWriter(result, {r: true, m: true});
    w.write(function(err){
      assert.equal(err, null);
      done(null, result);
    });
  });
}

describe('URI Mapping', function(){
  var count;
  
  before(function(cb){
    var self = this;
    config.dbstate.on("ready", function(){
      self.timeout(4000);
      self.src = fs.readFileSync(__dirname + "/../samples/CCD.sample.xml");
      config.db.patients.dropDatabase(function(err){
        assert.equal(err, null);    
        cb();
      });
    });
  });

  it('should successfully insert one CCDA', function(done){
    insertDoc(this.src, {skipValidation: true}, function(){
      config.db.patients.collection("links", function(err, links){
        links.find().count(function(err, val){
          count = val;
          done();
        });
      });
    });
  });

  it('should reconcile 100% of entries, sections, and documents by source ID', function(done){
    insertDoc(this.src, {skipValidation: true}, function(){
      config.db.patients.collection("links", function(err, links){
        links.find().count(function(err, val){
          assert.equal(count, val);
          done();
        });
      });
    });
  });

});

describe('ValueSet Validation', function(){
  before(function(cb){
    this.timeout(2000);
    this.src = fs.readFileSync(__dirname + "/../samples/CCD.sample.xml");
    config.db.patients.dropDatabase(function(err){
      assert.equal(err, null);    
      cb();
    });
  });

  it('should generate validation errors for incorrect codes', function(done){
    parseDoc(this.src, {skipValidation: false}, function(err, result){
      assert.equal(err, null);
      assert(result.errors.length > 0);
      done();
    });
  });
});

