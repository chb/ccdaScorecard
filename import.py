from lxml import etree
d = etree.parse(open("CCD.sample.xml"))
import ccd
i = ccd.ConsolidatedCDA(d)
import simplejson
import datetime

class HL7JsonEncoder(simplejson.JSONEncoder):
    def default(self, o):
        if isinstance(o, datetime.datetime):
            return o.isoformat()

print simplejson.dumps(i.json, sort_keys=True, indent=2, cls=HL7JsonEncoder)
