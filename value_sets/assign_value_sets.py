import csv
import pymongo
import MySQLdb, MySQLdb.cursors
from pymongo import Connection
import urllib

LOINC_TOP2K_VALUE_SET = "LOINC Top 2000"
VAKP_VALUE_SET = "SNOMED VA/KP Problem List"
CORE_PROBLEM_LIST_VALUE_SET = "SNOMED CORE Problem List"
GENERIC_CLINICAL_DRUG = "RxNorm Generic Clinical Drug"
BRANDED_CLINICAL_DRUG = "RxNorm Branded Clinical Drug"
BRAND_NAME = "RxNorm Brand Name"
GENERIC_NAME = "RxNorm Generic Name"

connection = Connection()
db = connection.vocab
concepts = db.concepts

# clear all value set flags

for code in concepts.find({'valueSets': {'$not': {'$size':0}}}):
    code['valueSets'] = []
    concepts.update({'_id': code['_id']}, code)
#    print code

print "Fetching codes from LOINC.org"
traw = urllib.urlopen('http://loinc.org/usage/obs/loinc-top-2000-plus-loinc-lab-observations-us.csv')
loincReader = csv.DictReader(traw)

for code in loincReader:
    concepts.update({"_id": "http://purl.bioontology.org/ontology/LNC/"+code['LOINC_NUM']}, {"$addToSet": {"valueSets": LOINC_TOP2K_VALUE_SET}})
    print code

db = MySQLdb.connect(host="localhost", user="umls", passwd="UMLS", db="umls", cursorclass=MySQLdb.cursors.DictCursor)

subsetq = """SELECT distinct code FROM umls.MRCONSO WHERE  sab='SNOMEDCT_US' and (CVF & %s > 0)"""

cur = db.cursor()
cur.execute(subsetq%512)
for v in cur.fetchall():
    concepts.update({"_id": "http://purl.bioontology.org/ontology/SNOMEDCT/"+v['code']}, {"$addToSet": {"valueSets": VAKP_VALUE_SET}})

cur.execute(subsetq%2048)
for v in cur.fetchall():
    concepts.update({"_id": "http://purl.bioontology.org/ontology/SNOMEDCT/"+v['code']}, {"$addToSet": {"valueSets": CORE_PROBLEM_LIST_VALUE_SET}})

cur.execute("""select SCUI, str from umls.MRCONSO where SAB='RXNORM' and TTY in ('SBD', 'BPCK');""");
for v in cur.fetchall():
    concepts.update({"_id": "http://purl.bioontology.org/ontology/RXNORM/"+v['SCUI']}, {"$addToSet": {"valueSets": BRANDED_CLINICAL_DRUG}})

cur.execute("""select SCUI, str from umls.MRCONSO where SAB='RXNORM' and TTY in ('SCD', 'GPCK');""");
for v in cur.fetchall():
    concepts.update({"_id": "http://purl.bioontology.org/ontology/RXNORM/"+v['SCUI']}, {"$addToSet": {"valueSets": GENERIC_CLINICAL_DRUG}})

cur.execute("""select SCUI, str from umls.MRCONSO where SAB='RXNORM' and TTY in ('IN', 'GPCK');""");
for v in cur.fetchall():
    concepts.update({"_id": "http://purl.bioontology.org/ontology/RXNORM/"+v['SCUI']}, {"$addToSet": {"valueSets": GENERIC_NAME}})

cur.execute("""select SCUI, str from umls.MRCONSO where SAB='RXNORM' and TTY in ('BN', 'BPCK');""");
for v in cur.fetchall():
    concepts.update({"_id": "http://purl.bioontology.org/ontology/RXNORM/"+v['SCUI']}, {"$addToSet": {"valueSets": BRAND_NAME}})


