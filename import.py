from lxml import etree
import ccd
import simplejson
import datetime
import pymongo
from pymongo import Connection
conn = Connection()
db = conn.ccda
raw_docs = db.raw_docs
docs = db.docs

class HL7JsonEncoder(simplejson.JSONEncoder):
    def default(self, o):
        if isinstance(o, datetime.datetime):
            return o.isoformat()

if __name__ == '__main__':
    import sys
    f = sys.argv[1]
    d = etree.parse(open(f))
    i=ccd.ConsolidatedCDA(d)
    raw_docs.insert({
        'raw': open(f).read(), 
        'received_at': datetime.datetime.utcnow()
        })
    docs.insert(i.json)
#    simplejson.dumps(i.json, sort_keys=True, indent=2, cls=HL7JsonEncoder)
