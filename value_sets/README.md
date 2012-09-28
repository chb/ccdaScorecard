Attempting to catalog value sets required and recommended in CCDA.

1. Value sets available from CDC's `phinvads.cdc.gov`
2. Value sets explicitly listed in the CCDA spec (but what does it mean when these are "dynamic"?)
3. Value sets "described" (ucum -- really a language more than a value set; or "look below this point in SNOMED CT") 

To import phinvads vocab:

```
python import_phinvads_vocab.py
```

TODO: resolve discrepency between value set vs. code system for Immunizations.  (CCDA is inconsistent).

Effectively we want all concept from the code set: 2.16.840.1.113883.12.292
... and we want to call that value set: 2.16.840.1.113883.3.88.12.80.22  (even though phinvads doesn't).

