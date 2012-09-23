Exploratory mapping of Consolidated CDA data to JSON, with a goal of preserving
CCDA's data model (but applying friendly names to properties whenever possible).

Inspired by popHealth's approach to mapping C32 (+ stronger linked data flavor)

Setup
```
$ git clone https://github.com/jmandel/json_ccda
$ cd json_ccda
$ npm install
```

Convert a CCD to JSON, without loading into DB:
```
$ node lib/ccda/import.py CCD.sample.xml -p 123 > sample_ccda.json
```

Convert and load into DB:
```
$ node lib/ccda/import.py CCD.sample.xml -p 123 -m 
```

Launching REST server:
```
$ ./node_modules/.bin/supervisor -- lib/servers/rest.js
```

In Browser: `http://localhost:3000/patient/12345/

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
* POST receiver to write JSON to DB (current output is files only)
* Example Mongo queries (e.g. "All patients w/ abnormal lab results since yesterday")

[ ] Consider a separate 'links' collecition to offload  many:many relations.  Keep the fact documents cleaner.  But still need patient links for filtering without joins... (or can actually do this by convention + regix on _id:regex:^http:.../patient/123 (but implies we need a slash or huffman-coded pids. patient link is explicit -> better.)

[ ] Batch request mode to issue multiple individual-URI GETs in a swell foop.
[ ] Standalone and then integrated Validation of expected coding systems / constraints (explicit valuesets, snomed subsumptions, ucum, ?countries)
[ ] dates should be live DB dates and serialized in the REST server.
[ ] Use Mongolabs' syntax for queriese (across the board!)
[ ] use async.auto or similar to handle import.js flag interactions.
[ ] strip sourceIDs from the JS rep andn include only in links... ?
[ ] apply consistent units at import-time for vital signs? --> consider code + unit mapping in the import layer, or pushing out to apps

[ ]how to handle results that don't really belong to panels? all-in-one, or one-per? 

[x] email struct doc WG to ask about IDs:  

    1.  Stable over time for an entry in a medicaiton list, or problem list, or vital sign?
    2.  Stable over time of an entry /changes/ (e.g. I upgrade asthma by adding a severity)?
    3.  Stable over time over change in status (inactive -> active) 
    4.  Are there current *actual* implementations that assign multiple identifiers to entries (meds, problems, labs; not people)
    


Data questions:

* "doseQuantity, if present, SHOULD contain zero or one [0..1]
@unit="1", which SHALL be selected from ValueSet UCUM Units of
Measure (case sensitive) 2.16.840.1.113883.1.11.12839
DYNAMIC (CONF:8842)." -- how does one _select_ the value "1"? How is UCUM involved?

* what is manufacturerOrganization or a manufacturedProduct? No datatype in RIM or CDA or CCDA

(datatypes should be copied over from CDA spec!  This is a serious usability
issue --> easy errors)

* Severity free-text lives in a "text" element while medication free-text and immunization free-text are in a "code's" "original." 


BP centiles app: will have to leave out encounterType. (Semantics for vitals in CCDA are only implicit -- which encoutner did a given value come from? who was reponsible for it? etc.)

no consistent codes required for vital signs

What is the *meaning* of a vitals organizer?  does it imply that systolic and diastolic are matched, if they appear in the same organizer?

reported:
* What does it mean when a text has text _and_ a reference, and they both are non-emtpy and non-identical?

reported:
* ActReason code in examples is 2.16.840.1.113883.11.19725 ; but in the published table it is listed as 2.16.840.1.113883.5.8 .  Appears examples are wrong in the CCDA 1.1 spec + accompanying XML files.

reported:
* what is a Medication Activity's or Immunization Activity's "code" element?
  (CDA and RIM don't seem to say -- different from routeCode, or
approachSiteCode).





