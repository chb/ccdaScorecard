Attempting to catalog value sets required and recommended in CCDA.

1. Value sets available from CDC's `phinvads.cdc.gov`
2. Value sets explicitly listed in the CCDA spec (but what does it mean when these are "dynamic"?)
3. Value sets "described" (ucum -- really a language more than a value set; or "look below this point in SNOMED CT") 

To import phinvads vocab:

```
sudo pip install mustaine
python import_phindas_vocab.py
```
