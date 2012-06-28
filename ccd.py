import datetime, copy, collections

ns = {
    "h":"urn:hl7-org:v3",
    "xsi": "http://www.w3.org/2001/XMLSchema-instance"
}

def xpath(doc, p):
    r= doc.xpath(p, namespaces=ns)
    return r

def freeTextRef(doc, ref):
    assert ref[0]=='#', "Invalid ref: %s"%ref
    m = xpath(doc, "//*[@ID='%s']/text()"%ref[1:])
    assert len(m)==1, "Not exactly 1 ref: %s, %s"%(m, ref)
    return m[0]

class SubStructure:
    def __init__(self, jsonpath, card, xpath, next_step=None):
        self.card = card
        self.required = not card.startswith("0") and True or False
        self.multiple = (card.endswith("*") or int(card[-1])>1) and True or False
        self.xpath = xpath
        self.jsonpath = jsonpath
        self.next_step = next_step or (lambda x: x)

    def run(self, doc, json):
        j = [] 

        if hasattr(self.xpath, '__call__'):
            matches = self.xpath(doc)
        else:
            matches = xpath(doc, self.xpath)

        if self.required:
            assert len(matches) >0, "Needed >0 %s"%self.xpath

        for m in matches:
            m_result = self.next_step(m)
            if hasattr(m_result, "json"):
                j.append(m_result.json)
            else:
                j.append(m_result)

        if not self.multiple: 
            assert len(j) <= 1, "Not expecting multiple %s"%self.xpath
            if len(j)>0:
                j = j[0]

        if j:
            components = self.jsonpath.split(".")
            path = json
            for p in components[:-1]:
                if p not in path:
                    path[p] = {}
                path = path[p]
                    
            path[components[-1]] = j

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

def HL7TimestampResolution(t):
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

    def extras(self):
        pass

    @classmethod
    def xpath(cls, doc):
        ret = []
        roots = cls.templateRoot

        if not isinstance(cls.templateRoot, list):
            roots = [roots]

        for root in roots:
            ret.extend(xpath(doc,".//h:templateId[@root='%s']/.."%root))

        return ret

    @classmethod
    def init_js(cls):
        return 

    def __init__(self, doc):
        self.json = copy.copy(self.js_template)
        self.doc = doc
        
        self.json['@type'] = self.__class__.__name__    
        for f in self.fields:
            SubStructure(*f).run(doc, self.json)

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

OIDS = {
"2.16.840.1.113883.1.11.19185" : ("HL7 Religion", "http://hl7.org/codes/ReligiousAffiliation#"),
"2.16.840.1.113883.6.238" : ("CDC Race", "http://phinvads.cdc.gov/vads/ViewCodeSystemConcept.action?oid=2.16.840.1.113883.6.238&code="),
"2.16.840.1.113883.5.2" : ("HL7 Marital Status", "http://hl7.org/codes/MaritalStatus#"),
"2.16.840.1.113883.6.1": ("LOINC", "http://purl.bioontology.org/ontology/LNC/"),
"2.16.840.1.113883.6.96":("SNOMED CT", "http://purl.bioontology.org/ontology/SNOMEDCT/"),
"2.16.840.1.113883.19":("Good Health Clinic", "http://hl7.org/goodhealth/"),
}

"""
<code code="329498" codeSystem="2.16.840.1.113883.6.88" displayName="Albuterol 0.09 MG/ACTUAT inhalant solution">
<originalText>
<reference value="#Med1"/>
</originalText>
<translation code="573621" displayName="Proventil 0.09 MG/ACTUAT inhalant solution" codeSystem="2.16.840.1.113883.6.88" codeSystemName="RxNorm"/>
"""

class Identifier(Importer):

    @property
    def fields(self):
      return [
            ("root","1..1", "@root"),
            ("extension","0..1", "@extension"),
           ]

    def extras(self):
        oid =  self.json["system"] = self.json["root"]
        del self.json["root"]
        
        name,url  = (None, None)
        if oid in OIDS:
            name,url = OIDS[oid]
            self.json['systemName'] = name
            self.json['label'] = name + " " + self.json["extension"]
        else:
            url = "urn:"+oid+"#"

        self.json["uri"] = url

        if "extension" in self.json:
            self.json["code"] = self.json["extension"]
            self.json["uri"] += self.json["extension"]
            del self.json["extension"]

class ConceptDescriptor(Importer):
    @property
    def fields(self):
      return [
            ("label","1..1", "@displayName"),
            ("code","1..1", "@code"),
            ("system","1..1", "@codeSystem"),
            ("systemName","1..1", "@codeSystemName"),
            ("translation","0..*", "h:translation", ConceptDescriptor),
           ]

    def extras(self):
        oid = self.json["system"]
        del self.json["system"]
        if oid in OIDS:
            name,url = OIDS[oid]
            if "systemName" not in self.json:
                self.json["systemName"] = name
        else:
            url = "urn:"+oid+"#"
       
        self.json["uri"] = url+self.json["code"]

class SimpleCode(ConceptDescriptor):
    @property
    def fields(self):
      return [
            ("code","1..1", "@code"),
            ("system","1..1", "@codeSystem"),
           ]

def SimpleCodeMap(m):
    class _ret(SimpleCode):
        def extras(self):
            super(_ret, self).extras()
            self.json['label'] = m[self.json['code']]
    _ret.__name__ = 'SimpleCode'
    return _ret

class Telecom(Importer):
    fields = [
       ("value", "1..1","@value"),
       ("use", "0..1", "@use", StringMap(TelecomUse))
    ]    

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
       ("preferred", "1..1","h:preferenceInd/@value", lambda x: x=='true' and True or False),
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
            ("gender","1..1", "h:patient/h:administrativeGenderCode/@displayName"),
            ("birthTime","1..1", "h:patient/h:birthTime/@value", HL7Timestamp),
           ]

class PhysicalQuantity(Importer):
    fields = [
            ("value","1..1", "@value"),
            ("unit", "0..1", "@unit"),
    ] 

class VitalSignObservation(Importer):
    templateRoot='2.16.840.1.113883.10.20.22.4.27'
    fields = [
            ("vitalName","1..1", "h:code", ConceptDescriptor),
            ("measuredAt", "1..1", "h:effectiveTime", EffectiveTime),
            ("physicalQuantity","1..1", "h:value[@xsi:type='PQ']", PhysicalQuantity),
            ("id","1..1", "h:id", Identifier),
            ("label","0..1", "h:text/h:reference/@value"),
            ("interpretations", "0..*", "h:interpretationCode", SimpleCodeMap(InterpretationUse))
    ] 

    def extras(self):
       if (self.json['label']):
            self.json['label'] = freeTextRef(self.doc, self.json['label']) 

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
            ("id","1..1", "h:id", Identifier),
            ("label","0..1", "h:text/h:reference/@value"),
            ("interpretations", "0..*", "h:interpretationCode[@codeSystem='2.16.840.1.113883.5.83']", SimpleCodeMap(InterpretationUse))
    ] 

    def extras(self):
       if ('label' in self.json):
            self.json['label'] = freeTextRef(self.doc, self.json['label']) 

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
#            ("name","0..1", "h:code", ConceptDescriptor),
            ("results","0..*", ResultsOrganizer.xpath, ResultsOrganizer),
    ] 

class ConsolidatedCDA(Importer):
    fields = [
            ("demographics", "1..*", "//h:recordTarget/h:patientRole", Patient),
            ("vitals", "0..1", VitalSignsSection.xpath, VitalSignsSection),
            ("results", "0..1", ResultsSection.xpath, ResultsSection),
           ]

