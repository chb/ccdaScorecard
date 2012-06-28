from lxml import etree
d = etree.parse(open("CCD.sample.xml"))
import ccd
i = ccd.CCDImporter(d)
import simplejson
import datetime

class HL7JsonEncoder(simplejson.JSONEncoder):
    def default(self, o):
        if isinstance(o, datetime.datetime):
            return o.isoformat()

print simplejson.dumps(i.ccd, sort_keys=True, indent=2, cls=HL7JsonEncoder)
