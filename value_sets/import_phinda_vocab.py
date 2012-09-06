import pymongo
from mustaine.client import HessianProxy
import mustaine
from pymongo import Connection

connection = Connection()
db = connection.vocab
value_sets = db.value_sets

service = HessianProxy("http://phinvads.cdc.gov/vocabService/v2")

def toBSON(o):
    ret = {}
    for k in dir(o):
        if k.startswith("_"): continue
        v = getattr(o,k)
        if type(v) == list:
            ret[k] = map(toBSON, v)
        elif type(v) == mustaine.protocol.Object:
            ret[k] = toBSON(v)
        else:
            ret[k] = v
    return ret

codeSystems = {}
for cs in db.code_systems.find({}):
    codeSystems[cs['oid']] = cs

def getCodeSystem(s):
    if s in codeSystems:
        return codeSystems[s]

    c = service.getCodeSystemByOid(s)
    assert c.totalResults == 1, "Got != 1 code system result for oid %s"%s
    codeSystems[s] = toBSON(c.codeSystems[0])
    db.code_systems.insert(codeSystems[s])
    return codeSystems[s]

PAGESIZE = 1000
def fetchValueSet(vsoid):
    versions = service.getValueSetVersionsByValueSetOid(vsoid)
    vsid = sorted(versions.valueSetVersions, key=lambda x: x.versionNumber)[-1].id
   
    value_sets.remove({'valueSetOid':vsoid})

    def fetchPage(pnum):
        return service.getValueSetConceptsByValueSetVersionId(vsid, pnum, PAGESIZE)

    pnum = 1 # 1-index pages
    fetched = 0

    while True:
        p = fetchPage(pnum)
        pnum += 1 

        for r in p.valueSetConcepts:
            cs = getCodeSystem(r.codeSystemOid)
            rbson = toBSON(r)
            rbson['valueSetOid'] = vsoid

            value_sets.insert({
                'conceptName': rbson['codeSystemConceptName'],    
                'conceptCode': rbson['conceptCode'], 
                'codeSystemName': cs['name'], 
                'codeSystemOid': rbson['codeSystemOid'],    
                'valueSetOid': rbson['valueSetOid'],    
            })

        fetched += len(p.valueSetConcepts)
        print "fetched", fetched
        if fetched >= p.totalResults:
            break
