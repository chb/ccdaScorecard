import MySQLdb, MySQLdb.cursors
import json
import pymongo
import copy
from pymongo import MongoClient

from nltk.tokenize import word_tokenize

mconnection = MongoClient()
mdb = mconnection.vocab
concepts = mdb.concepts

db = MySQLdb.connect(host="localhost", user="umls", passwd="UMLS", db="umls", cursorclass=MySQLdb.cursors.DictCursor)


COUNT=0

systems = [
        {
            'umls_sab': 'SNOMEDCT', 
            'oid': '2.16.840.1.113883.6.96', 
            'sab': 'SNOMED-CT', 
            'tty': ['PT'],
            'url': 'http://purl.bioontology.org/ontology/SNOMEDCT/'
        },
        {
            'umls_sab': 'SCTUSX', 
            'oid': '2.16.840.1.113883.6.96', 
            'sab': 'SNOMED-CT', 
            'tty': ['PT'],
            'url': 'http://purl.bioontology.org/ontology/SNOMEDCT/'
        },
        {
            'umls_sab': 'RXNORM', 
            'oid': '2.16.840.1.113883.6.88', 
            'sab': 'RxNorm', 
            'ttynot': ['ST', 'TMSY', 'OCD'],
            'url': 'http://purl.bioontology.org/ontology/RXNORM/'
        },
        {
            'umls_sab': 'LNC', 
            'oid': '2.16.840.1.113883.6.1', 
            'sab': 'LOINC', 
            'tty': ['LC'],
            'url': 'http://purl.bioontology.org/ontology/LNC/'
        }        
    ]


def getTokens(sab, code):
    cur = db.cursor()
    det = """select str from umls.MRCONSO where sab='%s' and code='%s';"""
    cur.execute(det%(sab, code))
    strs = cur.fetchall()
    tokens = set(word_tokenize(" ".join([x['str'] for x in strs]).lower()))
    return sorted(filter(lambda x: len(x)>1, tokens))

def makeRow(s, v):
    ret = {}
    ret['_id'] = s['url'] + v['code']
    ret['code'] = v['code']
    ret['codeSystem'] = s['oid']
    ret['codeSystemName'] = s['sab']
    ret['conceptName'] = v['str']
    ret['conceptNameTokens'] = getTokens(s['umls_sab'], v['code'])
    ret['valueSets'] = []
    ret['active'] = True
    if ('active' in s and (s['active'] == False)):
        ret['active'] = False
    return ret

def processSet(cur, query, s):
    global COUNT
    cur.execute(query)
    abunch = cur.fetchmany()
    while abunch:
        for v in abunch:
            COUNT += 1
            concept = makeRow(s, v)
            concepts.insert(concept)
            if COUNT%2000 == 0:
                print COUNT, concept
        abunch = cur.fetchmany()
""" 
# assign value sets in an external second pass
    if v['cvf'] and (v['cvf'] & 2048):
        ret['valueSets'].append("SNOMED CT CORE Problem List")

    if v['cvf'] and (v['cvf'] & 512):
        ret['valueSets'].append("VA/KP Problem List")
"""

cur = db.cursor()

for s in systems:
    allcodes = """select cui, code, sab, str, cvf from umls.MRCONSO where SAB='%s'"""%s['umls_sab']
    if ('ttynot' in s):
        allcodes += """ and tty not in (%s) """ % ("'" + "','".join(s['ttynot']) + "'")
    if ('tty' in s):
        allcodes += """ and tty in (%s) """ % ("'" + "','".join(s['tty']) + "'")
    print allcodes

    processSet(cur, allcodes, s)

snomedRetired = """select c.cui, c.code, c.sab, c.str, c.cvf 
from umls.MRCONSO c join umls.MRSAT a
where 
  c.sab='SNOMEDCT' and c.tty='OP'
  and a.code=c.SCUI and a.atn='CONCEPTSTATUS' and a.atv != '0';
"""
s = copy.deepcopy(systems[0])
s['active'] = False
processSet(cur, snomedRetired, s)


print "Counted", COUNT
