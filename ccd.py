import datetime, copy, collections, hashlib

BASE_URI = "http://smart-catcher/"

ns = {
    "h":"urn:hl7-org:v3",
    "xsi": "http://www.w3.org/2001/XMLSchema-instance"
}

OIDS = {
"2.16.840.1.113883.6.238" : ("CDC Race", "http://phinvads.cdc.gov/vads/ViewCodeSystemConcept.action?oid=2.16.840.1.113883.6.238&code="),
"2.16.840.1.113883.6.1": ("LOINC", "http://purl.bioontology.org/ontology/LNC/"),
"2.16.840.1.113883.6.96":("SNOMED CT", "http://purl.bioontology.org/ontology/SNOMEDCT/"),
"2.16.840.1.113883.19":("Good Health Clinic", "http://hl7.org/goodhealth/"),
"2.16.840.1.113883.1.11.19185" : ("HL7 Religion", "http://hl7.org/codes/ReligiousAffiliation#"),
"2.16.840.1.113883.5.2" : ("HL7 Marital Status", "http://hl7.org/codes/MaritalStatus#"),
"2.16.840.1.113883.5.83": ("HL7 Result Interpretation", "http://hl7.org/codes/ResultInterpretation#"),
"2.16.840.1.113883.5.111": ("HL7 Role", "http://hl7.org/codes/PersonalRelationship#"),
"2.16.840.1.113883.5.1119": ("HL7 Address", "http://hl7.org/codes/Address#"),
"2.16.840.1.113883.5.45": ("HL7 EntityName", "http://hl7.org/codes/EntityName#"),
"2.16.840.1.113883.5.1": ("HL7 AdministrativeGender", "http://hl7.org/codes/AdministrativeGender#"),
}

InterpretationUse = {
    '_system': '2.16.840.1.113883.5.83',
    'B':'better',
    'D':'decreased',
    'U':'increased',
    'W':'worse',
    '<':'low off scale',
    '>':'high off scale',
    'A':'Abnormal',
    'AA':'abnormal alert',
    'H':'High',
    'HH':'high alert',
    'L':'Low',
    'LL':'low alert',
    'N':'Normal',
    'I':'intermediate',
    'MS':'moderately susceptible',
    'R':'resistent',
    'S':'susceptible',
    'VS':'very susceptible',
    'EX':'outside threshold',
    'HX':'above high threshold',
    'LX':'below low threshold',
}

EntityNameUse = {
    '_system': '2.16.840.1.113883.5.45',
    'A': 'Artist/Stage',
    'ABC': 'Alphabetic',
    'ASGN': 'Assigned',
    'C': 'License',
    'I': 'Indigenous/Tribal',
    'IDE': 'Ideographic',
    'L': 'Legal',
    'P': 'Pseudonym',
    'PHON': 'Phonetic',
    'R': 'Religious',
    'SNDX': 'Soundex',
    'SRCH': 'Search',
    'SYL': 'Syllabic'
}

PostalAddressUse = {
    '_system': '2.16.840.1.113883.5.1119',
    'BAD': 'bad address',
    'CONF': 'confidential',
    'DIR': 'direct',
    'H': 'home address',
    'HP': 'primary home',
    'HV': 'vacation home',
    'PHYS': 'physical visit address',
    'PST': 'postal address',
    'PUB': 'public',
    'TMP': 'temporary',
    'WP': 'work place'
}

TelecomUse = {
    '_system': '2.16.840.1.113883.5.1119',
    'HP': 'primary home',
    'WP': 'work place',
    'MC': 'mobile contact',
    'HV': 'vacation home'
}

AdministrativeGenderUse = {
'_system': '2.16.840.1.113883.5.1',
'F': 'Female',
'M': 'Male',
'UN': 'Undifferentiated'
}

"""
MaritalStatus = {
'A ': 'Annulled',
'D ': 'Divorced',
'I ': 'Interlocutory',
'L ': 'Legally Separated',
'M ': 'Married',
'P ': 'Polygamous',
'S ': 'Never Married',
'T ': 'Domestic partner',
'W ': 'Widowed '
}
"""

def xpath(doc, p):
    r= doc.xpath(p, namespaces=ns)
    return r

def freeTextRef(doc, ref):
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
        """ Todo: bring this back at json generation time
        if j:
            components = self.jsonpath.split(".")
            path = json
            for p in components[:-1]:
                if p not in path:
                    path[p] = {}
                path = path[p]
                    
            path[components[-1]] = j
        """

def HL7Timestamp(t, parent):
    da = []
    da.append(len(t)>=4 and int(t[0:4]) or 1)
    da.append(len(t)>=6 and int(t[4:6]) or 1)
    da.append(len(t)>=8 and int(t[6:8]) or 0)
    da.append(len(t)>=10 and int(t[8:10]) or 0)
    da.append(len(t)>=12 and int(t[10:12]) or 0)
    da.append(len(t)>=14 and int(t[12:14]) or 0)
    return datetime.datetime(*da)

def HL7TimestampResolution(t, parent):
    if len(t)==4:
        return 'year';
    if len(t)==6:
        return 'month';
    if len(t)==8:
        return 'day';
    if len(t)==10:
        return 'hour';
    if len(t)==12:
        return 'minute';
    if len(t)==14:
        return 'second';
    else:
        assert len(t)>14, "unexpected timestamp length %s:%s"%(t,len(t))
        return 'subsecond'

def StringMap(m):
    def transform(x):
        return m[x]
    return transform

class Importer(object):
    fields = []
    js_template = {}

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

def SimplestCodeMap(val, m):
    oid=m['_system']
    name,uri=OIDS[oid]

    r = {
        '@type': 'SimpleCode',
        'system': oid,
        'systemName': name,
        'code': val,
        'label': m[val],
        'uri': uri+val
    }

    return r

class ConceptDescriptor(Importer):
    @property
    def fields(self):
      return [
            ("label","1..1", "@displayName"),
            ("code","1..1", "@code"),
            ("system","1..1", "@codeSystem"),
            ("systemName","0..1", "@codeSystemName"),
            ("nullFlavor","0..1", "@nullFlavor"),
            ("translation","0..*", "h:translation", ConceptDescriptor),
           ]

    def cleanup(self):
        if "nullFlavor" in self.subs:
            return

        oid = self.subs["system"]
        if oid in OIDS:
            name,url = OIDS[oid]
            if "systemName" not in self.subs:
                self.subs["systemName"] = name
        else:
            url = "urn:"+oid+"#"
        url += self.subs["code"]
        self.subs["uri"] = url

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
           self.subs["use"] = SimplestCodeMap(self.subs["use"], PostalAddressUse) 

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
           self.subs["use"] = SimplestCodeMap(self.subs["use"], EntityNameUse) 

class Telecom(Importer):
    fields = [
       ("value", "1..1","@value"),
       ("use", "0..1", "@use")
    ]    

    def cleanup(self):
       if ("use" in self.subs):
           self.subs["use"] = SimplestCodeMap(self.subs["use"], TelecomUse) 


class Guardian(Importer):
    fields = [
            ("relation","0..1", "h:code", ConceptDescriptor),
            ("address","0..*", "h:addr", Address),
            ("name","1..*", "h:guardianPerson/h:name", Name),
            ("telecom","0..*", "h:telecom", Telecom),
           ]

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
        itemid = item.subs['id']
    else:
        itemid="RANDOMID"

    uri = "http://smart-catchers/records/%s"%record_id
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

    def GetMRN(self):
        ## Insert local logic for determining "the" identifier of several
        return self.subs["medicalRecordNumbers"][0].subs["extension"]

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
            ("vitalName","1..1", "h:code", ConceptDescriptor),
            ("measuredAt", "1..1", "h:effectiveTime", EffectiveTime),
            ("physicalQuantity","1..1", "h:value[@xsi:type='PQ']", PhysicalQuantity),
            ("label","0..1", "h:text/h:reference/@value"),
            ("interpretations", "0..*", "h:interpretationCode")
    ] 

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
            ("vitalSigns","0..*", VitalSignsOrganizer.xpath, VitalSignsOrganizer),
    ] 

class ResultObservation(Importer):
    templateRoot='2.16.840.1.113883.10.20.22.4.2'
    fields = [
            ("resultName","1..1", "h:code", ConceptDescriptor),
            ("measuredAt", "1..1", "h:effectiveTime", EffectiveTime),
            ("physicalQuantity","1..1", "h:value[@xsi:type='PQ']", PhysicalQuantity),
            ("label","0..1", "h:text/h:reference/@value"),
            ("interpretations", "0..*", "h:interpretationCode[@codeSystem='2.16.840.1.113883.5.83']")
    ] 

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
            ("results","0..*", ResultsOrganizer.xpath, ResultsOrganizer),
    ] 


class ConsolidatedCDA(Importer):
    fields = [
            ("demographics", "1..1", "//h:recordTarget/h:patientRole", Patient),
            ("vitals", "0..1", VitalSignsSection.xpath, VitalSignsSection),
            ("results", "0..1", ResultsSection.xpath, ResultsSection),
           ]
    def __init__(self, doc):
        super(ConsolidatedCDA, self).__init__(doc, parent=None)
        self.record_id = self.subs['demographics'].GetMRN()

        super(ConsolidatedCDA, self).postprocess()
