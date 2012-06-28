import datetime

ns = {"h":"urn:hl7-org:v3"}

def xpath(doc, p):
    return doc.xpath(p, namespaces=ns)

def freeTextRef(doc, ref):
    assert ref[0]=='#', "Invalid ref: %s"%ref
    m = xpath(doc, "//*[@ID='%s']/text()"%ref[1:])
    assert len(m)==1, "Not exactly 1 ref: %s, %s"%(m, ref)
    return m[0]

class SubStructure:
    def __init__(self, jsonpath, card, xpath, importer):
        self.card = card
        self.required = not card.startswith("0") and True or False
        self.multiple = (card.endswith("*") or int(card[-1])>1) and True or False
        self.xpath = xpath
        self.jsonpath = jsonpath
        self.importer = importer

    def run(self, doc, json):

        j = [] 

        matches = xpath(doc, self.xpath)
        if self.required:
            assert len(matches) >0, "Needed >0 %s"%self.xpath

        for m in matches:
            j.append({})
            self.importer(m, j[-1])

        if not self.multiple: 
            assert len(j) <= 1, "Not expecting multiple %s"%self.xpath
            if len(j)>0:
                j = j[0]
        if j:
            json[self.jsonpath] = j

class Field:
    def __init__(self, jsonpath, card, xpath, process=None):
        self.card = card
        self.required = not card.startswith("0") and True or False
        self.multiple = (card.endswith("*") or int(card[-1])>1) and True or False
        self.xpath = xpath
        self.jsonpath = jsonpath
        self.process = process or (lambda x: x)

    def run(self, doc, js):
        matches = xpath(doc, self.xpath)
        r = []
        for m in matches:
            r.append(self.process(m))

        if self.required:
            assert len(r) >0, "Found none for %s"%self.xpath

        if self.multiple and r:
            js[self.jsonpath] = r

        else:
            assert len(r) <=1, "Found multiple for %s"%self.xpath
            if len(r)>0:
                js[self.jsonpath] = r[0]

InterpretationUse = {
'Carrier':'Carrier',
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
'HP': 'primary home',
'WP': 'work place',
'MC': 'mobile contact',
'HV': 'vacation home'
}

"""
AdministrativeGender = {
'F': 'Female',
'M': 'Male',
'UN': 'Undifferentiated'
}

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

def HL7Timestamp(t):
    da = []
    da.append(len(t)>=4 and int(t[0:4]) or 1)
    da.append(len(t)>=6 and int(t[4:6]) or 1)
    da.append(len(t)>=8 and int(t[6:8]) or 0)
    da.append(len(t)>=10 and int(t[8:10]) or 0)
    da.append(len(t)>=12 and int(t[10:12]) or 0)
    da.append(len(t)>=14 and int(t[12:14]) or 0)
    return datetime.datetime(*da)

def StringMap(m):
    def transform(x):
        return m[x]
    return transform

class Importer(object):
    subs = []
    fields = []

    @classmethod
    def xpath(cls):
        return ".//h:templateId[@root='%s']/.."%cls.templateRoot

    def extras(self):
        pass

    def __init__(self, doc, js):
        self.json = js
        self.doc = doc

        for s in self.subs:
            SubStructure(*s).run(doc, self.json)

        for f in self.fields:
            Field(*f).run(doc, self.json)

        self.extras()

class Address(Importer):
   fields = [
           ("streetAddress", "1..4","h:streetAddressLine/text()"),
           ("city", "1..1","h:city/text()"),
           ("state", "0..1","h:state/text()"),
           ("zip", "0..1","h:postalCode/text()"),
           ("country", "0..1","h:country/text()"),
           ("use", "0..1", "@use", StringMap(PostalAddressUse))
           ] 

class Name(Importer):
   fields = [
           ("prefix", "0..*","h:prefix/text()"),
           ("given", "1..*","h:given/text()"),
           ("family", "1..1","h:family/text()"),
           ("suffix", "0..1","h:suffix/text()"),
           ("use", "0..1", "@use", StringMap(EntityNameUse))
           ] 

OID_TO_URL = {
"2.16.840.1.113883.1.11.19185" : "http://hl7.org/codes/ReligiousAffiliation#",
"2.16.840.1.113883.6.238" : "http://phinvads.cdc.gov/vads/ViewCodeSystemConcept.action?oid=2.16.840.1.113883.6.238&code=",
"2.16.840.1.113883.5.2" : "http://hl7.org/codes/MaritalStatus#",
"2.16.840.1.113883.6.1": "http://purl.bioontology.org/ontology/LNC/",
"2.16.840.1.113883.6.96":"http://purl.bioontology.org/ontology/SNOMEDCT/",
}

class SimpleCode(Importer):
    fields = [
            ("label","1..1", "@displayName"),
            ("code","1..1", "@code"),
            ("system","1..1", "@codeSystem"),
            ("systemName","1..1", "@codeSystemName"),
           ]

    def extras(self):
        oid = self.json["system"]
        del self.json["system"]
        if oid in OID_TO_URL:
            url = OID_TO_URL[oid]
        else:
            url = "urn:"+oid+"#"
        self.json["uri"] = url+self.json["code"]

class Telecom(Importer):
    fields = [
       ("value", "1..1","@value"),
       ("use", "0..1", "@use", StringMap(TelecomUse))
    ]    

class Guardian(Importer):
    subs = [
            ("relation","0..1", "h:code", SimpleCode),
            ("address","0..*", "h:addr", Address),
            ("name","1..*", "h:guardianPerson/h:name", Name),
            ("telecom","0..*", "h:telecom", Telecom),
           ]

class LanguageCommunication(Importer):
    subs = [
            ("mode","0..1", "h:modeCode", SimpleCode),
            ("proficiency","0..1", "h:proficiencyLevelCode", SimpleCode),
           ]

    fields = [
       ("code", "1..1","h:languageCode/@code"),
       ("preferred", "1..1","h:preferenceInd/@value", lambda x: x=='true' and True or False),
    ]    

class EffectiveTime(Importer):
    fields = [
            ("point","0..1", "@value", HL7Timestamp),
            ("low","0..1", "h:low/@value", HL7Timestamp),
            ("high","0..1", "h:high/@value", HL7Timestamp),
           ]

class Patient(Importer):
    subs = [
            ("name","1..1", "h:patient/h:name", Name),
            ("maritalStatus","0..1", "h:patient/h:maritalStatusCode", SimpleCode),
            ("religion","0..1", "h:patient/h:religiousAffiliationCode", SimpleCode),
            ("race","0..1", "h:patient/h:raceCode", SimpleCode),
            ("address","0..*", "h:addr", Address),
            ("guardian","0..*", "h:patient/h:guardian", Guardian),
            ("telecom","0..*", "h:telecom", Telecom),
            ("language","0..*", "h:patient/h:languageCommunication", LanguageCommunication),
           ]

    fields = [
            ("mrn","1..*", "h:id/@extension"),
            ("gender","1..1", "h:patient/h:administrativeGenderCode/@displayName"),
            ("birthTime","1..1", "h:patient/h:birthTime/@value", HL7Timestamp),
           ]

class PhysicalQuantity(Importer):
    pass

class VitalSignObservation(Importer):
    templateRoot='2.16.840.1.113883.10.20.22.4.27'
    subs = [
            ("vitalName","1..1", "h:code", SimpleCode),
            ("measuredAt", "1..1", "h:effectiveTime", EffectiveTime),
            ("value","1..1", "h:code", PhysicalQuantity),
    ] 

    fields = [
            ("id","1..1", "h:id/@root"),
            ("label","0..1", "h:text/h:reference/@value"),
            ("interpretations", "0..*", "h:interpretationCode/@code", StringMap(InterpretationUse))
    ] 

    def extras(self):
       if (self.json['label']):
            self.json['label'] = freeTextRef(self.doc, self.json['label']) 

class VitalSignsOrganizer(Importer):
    templateRoot='2.16.840.1.113883.10.20.22.4.26'
    subs = [
#            ("name","0..1", "h:code", SimpleCode),
            ("measuredAt", "1..1", "h:effectiveTime", EffectiveTime),
            ("vitalSign", "1..*", VitalSignObservation.xpath(), VitalSignObservation)
    ]
class VitalSignsSection(Importer):
    templateRoot='2.16.840.1.113883.10.20.22.2.4.1'

    subs = [
#            ("name","0..1", "h:code", SimpleCode),
            ("vitalSigns","0..*", VitalSignsOrganizer.xpath(), VitalSignsOrganizer),
    ] 

    fields = [
            ("mrn","0..*", "h:id/@extension"),
            ("gender","0..1", "h:patient/h:administrativeGenderCode/@displayName"),
    ] 

class CCDImporter(Importer):
    subs = [
            ("patient", "1..*", "//h:recordTarget/h:patientRole", Patient),
            ("vitalsSection", "0..1", VitalSignsSection.xpath(), VitalSignsSection)
           ]

    def __init__(self, doc):
        js = self.ccd = {}
        super(CCDImporter, self).__init__(doc, js)
