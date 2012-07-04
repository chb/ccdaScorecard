Exploratory mapping of Consolidated CDA data to JSON, with a goal of preserving
CCDA's data model (but applying friendly names to properties whenever possible).

Inspired by popHealth's approach to mapping C32 (+ stronger linked data flavor)

`python import.py CCD.sample.xml > sample_ccda.json`

Lots of outstanding questions, including:
* How to deal with negation indicators?
* How to deal with nullFlavors? (Currently dropping.)
* How to effectively deal with elements that have multiple IDs
* How to map document and entry IDs to stable URIs
* How to assign IDs to sections (which have none in CCDA)
