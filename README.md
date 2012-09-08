Exploratory mapping of Consolidated CDA data to JSON, with a goal of preserving
CCDA's data model (but applying friendly names to properties whenever possible).

Inspired by popHealth's approach to mapping C32 (+ stronger linked data flavor)

Setup
```
$ git clone https://github.com/jmandel/json_ccda
$ cd json_ccda
$ npm install
```

Convert a CCD to JSON (currently outputs a file, doesn't load into DB):
```
$ node import.py CCD.sample.xml > sample_ccda.json
```

Launching REST server:
```
$ ./node_modules/.bin/supervisor -- rest.js
```

In Browser: `http://localhost:3000/records/12345/Patient`

Testing:
```
$ ./node_modules/.bin/mocha -R spec
```

Lots of outstanding mapping questions, including:

* How to deal with negation indicators? (Would like separate 'AllergyNegation' items, rathern than just a flag)

* How to deal with nullFlavors? (Currently dropping for simple attributes; this
seems okay, otherwise JSON gets very cumbersome.  Will want to treat
nullFlavor differently in special cases, like problem codes that weren't
mappable to SNOMED / ICD10)

* How to effectively deal with elements that have multiple IDs (should be able
to lookup an item by any of its IDs; possibly just receiving a list of URIs
for that item).

* How to map document and entry IDs to stable URIs (considering using three
hierarchies in paralle: `documents`, `sections` and `entries` corresponding
fairly closely to these concepts in CCDA; except an `entry` will be
constrained.)

* How to assign IDs to sections (which have none in CCDA)

TODO:
* Get coding systems in DB (out of flat file)
* Validation of expected coding systems / constraints
* POST receiver to write JSON to DB (current output is files only)
* Example Mongo queries (e.g. "All patients w/ abnormal lab results since yesterday")

Data questions:

* what is a Medication Activity's or Immunization Activity's "code" element?
  (CDA and RIM don't seem to say -- different from routeCode, or
approachSiteCode).

* "doseQuantity, if present, SHOULD contain zero or one [0..1]
@unit="1", which SHALL be selected from ValueSet UCUM Units of
Measure (case sensitive) 2.16.840.1.113883.1.11.12839
DYNAMIC (CONF:8842)." -- how does one _select_ the value "1"? How is UCUM involved?

* what is manufacturerOrganization or a manufacturedProduct? No datatype in RIM or CDA or CCDA

(datatypes should be copied over from CDA spec!  This is a serious usability
issue --> easy errors)
