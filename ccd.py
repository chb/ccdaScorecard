import datetime, copy, collections, hashlib
from oids import OID_Library
from processors import *

BASE_URI = "http://ccda-receiver.smartplatforms.org"

ns = {
    "h":"urn:hl7-org:v3",
    "xsi": "http://www.w3.org/2001/XMLSchema-instance"
}


def xpath(doc, p):
    r= doc.xpath(p, namespaces=ns)
    return r

def FreeTextRef(doc, ref):
    assert ref[0]=='#', "Invalid ref: %s"%ref
    m = xpath(doc, "//*[@ID='%s']/text()"%ref[1:])
    assert len(m)==1, "Not exactly 1 ref: %s, %s"%(m, ref)
    return m[0]

class SubStructure:
    def __init__(self, subpath, card, xpath, next_step=None):
        self.card = card
        self.required = not card.startswith("0") and True or False
        self.multiple = (card.endswith("*") or int(card[-1])>1) and True or False
        self.xpath = xpath
        self.subpath = subpath
        self.next_step = next_step or (lambda x, y: x)

    def run(self, doc, caller):
        j = [] 

        if hasattr(self.xpath, '__call__'):
            matches = self.xpath(doc)
        else:
            matches = xpath(doc, self.xpath)

        if self.required:
            if len(matches) == 0:
                caller.cardinality_error(self, doc)

        for m in matches:
            m_result = self.next_step(m, caller)
            j.append(m_result)

        if not self.multiple: 
            assert len(j) <= 1, "Not expecting multiple %s"%self.xpath
            if len(j)>0:
                j = j[0]
        if j:
            caller.subs[self.subpath] = j
class Importer(object):
    fields = []
    js_template = {}

    def precleanup(self):
        pass

    def cleanup(self):
        pass

    @property
    def root(self):
        p = self
        while p.parent: p = p.parent
        return p
    
    @classmethod
    def xpath(cls, doc):
        ret = []
        roots = cls.templateRoot

        if not isinstance(cls.templateRoot, list):
            roots = [roots]

        for root in roots:
            ret.extend(xpath(doc,".//h:templateId[@root='%s']/.."%root))

        return ret

    def cardinality_error(self, substructure, doc):
        self.errors.append((substructure, doc))

    def __init__(self, doc, parent=None):
        self.subs = {}
        self.doc = doc
        self.parent = parent
        self.errors = []

        for f in self.fields:
            SubStructure(*f).run(doc, self)

        assert len(self.errors) == 0, "%s Finished with errors: %s" % (self.errors, len(self.errors))
        self.precleanup()

    @property
    def subitems_flat(self):
        for k,v in self.subs.iteritems():
            totraverse = v
            if type(v) != list:
                totraverse = [v]
            for i in totraverse:
                yield i
        yield

    def postprocess(self):
        self.cleanup()
        for i in self.subitems_flat:
            if hasattr(i,"postprocess"):
                i.postprocess()

    @classmethod
    def s_or_j(cls, v):
        if hasattr(v, "json"):
            return v.json
        return v

    @property
    def json(self):
        r = {}
        for k,v in self.subs.iteritems():
            if type(v) == list:
                r[k] = map(Importer.s_or_j, v)
            else:
                r[k] = Importer.s_or_j(v)
        return r

class Identifier(Importer):

      fields = [
            ("root","1..1", "@root"),
            ("extension","0..1", "@extension"),
           ]

def SimplestCodeMap(val, o):

    r = {
        '@type': 'SimpleCode',
        'systemName': o.name,
        'code': val,
        'label': o.table[val],
        'uri': o.uri+val
    }

    return r

class ConceptDescriptor(Importer):
    @property
    def fields(self):
      return [
            ("label","0..1", "@displayName"),
            ("code","1..1", "@code"),
            ("system","1..1", "@codeSystem"),
            ("systemName","0..1", "@codeSystemName"),
            ("nullFlavor","0..1", "@nullFlavor"),
            ("translation","0..*", "h:translation", ConceptDescriptor),
           ]

    def precleanup(self):
        if "nullFlavor" in self.subs:
            return

        oid = self.subs["system"]
        o = OID_Library.by_oid(oid)
        if "label" not in self.subs:
            self.subs["label"] = o.table[self.subs["code"]]
        if "systemName" not in self.subs:
            self.subs["systemName"] = o.name

        #uri = "urn:"+oid+"#"
        uri = o.uri + self.subs["code"]
        self.subs["uri"] = uri
        del self.subs["system"]

class Address(Importer):
   fields = [
           ("streetAddress", "1..4","h:streetAddressLine/text()"),
           ("city", "1..1","h:city/text()"),
           ("state", "0..1","h:state/text()"),
           ("zip", "0..1","h:postalCode/text()"),
           ("country", "0..1","h:country/text()"),
           ("use", "0..1", "@use")
           ] 

   def cleanup(self):
       if ("use" in self.subs):
           self.subs["use"] = SimplestCodeMap(self.subs["use"], OID_Library.by_name("HL7 Address"))['label']
class Name(Importer):
   fields = [
           ("prefix", "0..*","h:prefix/text()"),
           ("given", "1..*","h:given/text()"),
           ("family", "1..1","h:family/text()"),
           ("suffix", "0..1","h:suffix/text()"),
           ("use", "0..1", "@use")
           ] 

   def cleanup(self):
       if ("use" in self.subs):
           self.subs["use"] = SimplestCodeMap(self.subs["use"], OID_Library.by_name("HL7 EntityName"))['label']

class Telecom(Importer):
    fields = [
       ("value", "1..1","@value"),
       ("use", "0..1", "@use")
    ]    

    def cleanup(self):
       if ("use" in self.subs):
           self.subs["use"] = SimplestCodeMap(self.subs["use"], OID_Library.by_name("HL7 Address"))['label']


class Guardian(Importer):
    fields = [
            ("relation","0..1", "h:code", ConceptDescriptor),
            ("address","0..*", "h:addr", Address),
            ("name","1..*", "h:guardianPerson/h:name", Name),
            ("telecom","0..*", "h:telecom", Telecom),
           ]

    def cleanup(self): 
        if "relation" in self.subs:
            self.subs["relation"] = self.subs["relation"].subs["label"]

class LanguageCommunication(Importer):
    fields = [
       ("mode","0..1", "h:modeCode", ConceptDescriptor),
       ("proficiency","0..1", "h:proficiencyLevelCode", ConceptDescriptor),
       ("code", "1..1","h:languageCode/@code"),
       ("preferred", "1..1","h:preferenceInd/@value", lambda x, parent: x=='true' and True or False),
    ]    

class EffectiveTime(Importer):
    fields = [
            ("point","0..1", "@value", HL7Timestamp),
            ("pointResolution","0..1", "@value", HL7TimestampResolution),
            ("low","0..1", "h:low/@value", HL7Timestamp),
            ("lowResolution","0..1", "h:low/@value", HL7TimestampResolution),
            ("high","0..1", "h:high/@value", HL7Timestamp),
            ("highResolution","0..1", "h:high/@value", HL7TimestampResolution),
           ]

def GenerateURI(item):
    record_id = item.root.record_id
    typename = item.__class__.__name__

    if "id" in item.subs:
        ii = item.subs['id']
        if isinstance(ii, list):
            ii=ii[0]
 
        if "root" in ii.subs:
            itemid = ii.subs["root"]
        if "extension" in ii.subs:
            itemid = ii.subs["extension"] + itemid
        del item.subs["id"]
    else:
        itemid=RandomString(12)

    uri = BASE_URI + "/records/%s"%record_id
    if typename=="Patient":
        return uri+"/Patient"
    return "%s/%s/%s"%(uri, typename, itemid)

class Patient(Importer):
    fields = [
            ("name","1..1", "h:patient/h:name", Name),
            ("maritalStatus","0..1", "h:patient/h:maritalStatusCode", ConceptDescriptor),
            ("religion","0..1", "h:patient/h:religiousAffiliationCode", ConceptDescriptor),
            ("race","0..1", "h:patient/h:raceCode", ConceptDescriptor),
            ("address","0..*", "h:addr", Address),
            ("guardian","0..*", "h:patient/h:guardian", Guardian),
            ("telecom","0..*", "h:telecom", Telecom),
            ("language","0..*", "h:patient/h:languageCommunication", LanguageCommunication),
            ("medicalRecordNumbers","1..*", "h:id", Identifier),
            ("gender","1..1", "h:patient/h:administrativeGenderCode", ConceptDescriptor),
            ("birthTime","1..1", "h:patient/h:birthTime/@value", HL7Timestamp),
            ("birthTimeResolution","1..1", "h:patient/h:birthTime/@value", HL7TimestampResolution),
           ]

    def cleanup(self):
        self.subs["uri"] = GenerateURI(self) 
        self.subs["medicalRecordNumbers"] = map(lambda x: x.subs["extension"], self.subs["medicalRecordNumbers"])
        self.subs["gender"] = self.subs["gender"].subs["label"]
        if "maritalStatus" in self.subs:
            self.subs["maritalStatus"] = self.subs["maritalStatus"].subs["label"]

    _mrn = None
    @property
    def mrn(self):
        if self._mrn: return self._mrn
        # Insert local logic for determining "the" identifier of several
        self._mrn = self.subs["medicalRecordNumbers"][0].subs["extension"]
        return self._mrn

def float_if_possible(x, parent):
    try:
        return float(x)
    except:
        return x

class PhysicalQuantity(Importer):
    fields = [
            ("value","1..1", "@value", float_if_possible), 
            ("unit", "0..1", "@unit"),
    ] 


class VitalSignObservation(Importer):
    templateRoot='2.16.840.1.113883.10.20.22.4.27'
    fields = [
            ("id","1..1", "h:id", Identifier),
            ("vitalName","1..1", "h:code", ConceptDescriptor),
            ("measuredAt", "1..1", "h:effectiveTime", EffectiveTime),
            ("physicalQuantity","1..1", "h:value[@xsi:type='PQ']", PhysicalQuantity),
            ("label","0..1", "h:text/h:reference/@value"),
            ("interpretations", "0..*", "h:interpretationCode[@codeSystem='2.16.840.1.113883.5.83']", ConceptDescriptor)
    ]

    def cleanup(self):

        if 'label' in self.subs:
            self.subs['label'] = FreeTextRef(self.doc, self.subs['label']) 

        if 'interpretations' in self.subs:
            self.subs['interpretations'] = map(lambda x: x.subs['label'], self.subs['interpretations'])

        self.subs["uri"] = GenerateURI(self) 

class VitalSignsOrganizer(Importer):
    templateRoot='2.16.840.1.113883.10.20.22.4.26'
    fields = [
#            ("name","0..1", "h:code", ConceptDescriptor),
            ("measuredAt", "1..1", "h:effectiveTime", EffectiveTime),
            ("vitalSign", "1..*", VitalSignObservation.xpath, VitalSignObservation)
    ]
class VitalSignsSection(Importer):
    templateRoot='2.16.840.1.113883.10.20.22.2.4.1'

    fields = [
#            ("name","0..1", "h:code", ConceptDescriptor),
            ("vitalSignOrganizers","0..*", VitalSignsOrganizer.xpath, VitalSignsOrganizer),
    ] 

class ResultObservation(Importer):
    templateRoot='2.16.840.1.113883.10.20.22.4.2'
    fields = [
            ("id","1..1", "h:id", Identifier),
            ("resultName","1..1", "h:code", ConceptDescriptor),
            ("measuredAt", "1..1", "h:effectiveTime", EffectiveTime),
            ("physicalQuantity","1..1", "h:value[@xsi:type='PQ']", PhysicalQuantity),
            ("label","0..1", "h:text/h:reference/@value"),
            ("interpretations", "0..*", "h:interpretationCode[@codeSystem='2.16.840.1.113883.5.83']", ConceptDescriptor)
    ] 

    def cleanup(self):
        if 'label' in self.subs:
            self.subs['label'] = FreeTextRef(self.doc, self.subs['label']) 

        if 'interpretations' in self.subs:
            self.subs['interpretations'] = map(lambda x: x.subs['label'], self.subs['interpretations'])

        self.subs["uri"] = GenerateURI(self) 

class ResultsOrganizer(Importer):
    templateRoot='2.16.840.1.113883.10.20.22.4.1'
    fields = [
            ("batteryName","0..1", "h:code", ConceptDescriptor),
            ("result", "1..*", ResultObservation.xpath, ResultObservation)
    ]
class ResultsSection(Importer):
    templateRoot=[
        '2.16.840.1.113883.10.20.22.2.3',
        '2.16.840.1.113883.10.20.22.2.3.1' # .1 for "entries required"
    ]

    fields = [
            # TODO: define strategy for faking URIs for id-less sections
#            ("name","0..1", "h:code", ConceptDescriptor),
            ("resultOrganizers","0..*", ResultsOrganizer.xpath, ResultsOrganizer),
    ] 


class ConsolidatedCDA(Importer):
    fields = [
            ("demographics", "1..1", "//h:recordTarget/h:patientRole", Patient),
            ("vitals", "0..1", VitalSignsSection.xpath, VitalSignsSection),
            ("results", "0..1", ResultsSection.xpath, ResultsSection),
           ]

    def __init__(self, doc):
        super(ConsolidatedCDA, self).__init__(doc, parent=None)

    def precleanup(self):
        self.record_id = self.subs['demographics'].mrn
        super(ConsolidatedCDA, self).postprocess()
