from lxml import etree
import ccd
import simplejson
import datetime
import pymongo
from pymongo import Connection

conn = Connection()
db = conn.ccda_receiver

raw_docs = db.raw_docs

class HL7JsonEncoder(simplejson.JSONEncoder):
    def default(self, o):
        if isinstance(o, datetime.datetime):
            return o.isoformat()

if __name__ == '__main__':
    import sys
    f = sys.argv[1]
    d = etree.parse(open(f))
    i=ccd.ConsolidatedCDA(d)

    """
    raw_docs.insert({
        'raw': open(f).read(), 
        'received_at': datetime.datetime.utcnow()
        })
    """
    def insert(d):
        if hasattr(d, 'standalone') and d.standalone == True:
            getattr(db, d.__class__.__name__).insert(d.to_json(True))
        if hasattr(d, 'subs'):
            for s in d.subitems_flat:
                insert(s)
    insert(i)

#    print simplejson.dumps(i.json, sort_keys=True, indent=2, cls=HL7JsonEncoder)
