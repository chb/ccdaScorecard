class OID_Library(object):
    registered = []

    @classmethod
    def register(cls, oidclass):
        cls.registered.append(oidclass)

    @classmethod
    def by_oid(cls, oid):
        return filter(lambda x: x.oid==oid, cls.registered)[0]

    @classmethod
    def by_name(cls, name):
        return filter(lambda x: x.name==name, cls.registered)[0]

@OID_Library.register
class CDC_Race():
    oid = "2.16.840.1.113883.6.238"
    name = "CDC Race"
    uri = "http://phinvads.cdc.gov/vads/ViewCodeSystemConcept.action?oid=2.16.840.1.113883.6.238&code="

    
@OID_Library.register
class LOINC():
    oid = "2.16.840.1.113883.6.1"
    name = "LOINC"
    uri =  "http://purl.bioontology.org/ontology/LNC/"

@OID_Library.register
class RXNORM():
    oid = "2.16.840.1.113883.6.88"
    name = "RXNORM"
    uri =  "http://purl.bioontology.org/ontology/RXNORM/"


@OID_Library.register
class SNOMED():
    oid = "2.16.840.1.113883.6.96"
    name = "SNOMED CT"
    uri =  "http://purl.bioontology.org/ontology/SNOMEDCT/"

@OID_Library.register
class GoodHealth():
    oid = "2.16.840.1.113883.19"
    name = "Good Health Clinic"
    uri =  "http://hl7.org/goodhealth/"

@OID_Library.register
class ReligiousAffiliation():
    oid = "2.16.840.1.113883.1.11.19185" 
    name = "HL7 Religion"
    uri =  "http://hl7.org/codes/ReligiousAffiliation#"

@OID_Library.register
class LanguageAbility():
    oid = "2.16.840.1.113883.5.60" 
    name = "HL7 LanguageAbility"
    uri =  "http://hl7.org/codes/LanguageAbility#"

@OID_Library.register
class MaritalStatus():
    oid = "2.16.840.1.113883.5.2" 
    name = "HL7 Marital Status"
    uri =  "http://hl7.org/codes/MaritalStatus#"

@OID_Library.register
class ResultInterpretation():
    oid = "2.16.840.1.113883.5.83"
    name = "HL7 Result Interpretation"
    uri =  "http://hl7.org/codes/ResultInterpretation#"
    table = {
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

@OID_Library.register
class PersonalRelationship():
    oid = "2.16.840.1.113883.5.111"
    name = "HL7 Role"
    uri =  "http://hl7.org/codes/PersonalRelationship#"

@OID_Library.register
class AddressUse():
    oid = "2.16.840.1.113883.5.1119"
    name = "HL7 Address"
    uri =  "http://hl7.org/codes/Address#"
    table = {
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

@OID_Library.register
class EntityNameUse():
    oid = "2.16.840.1.113883.5.45"
    name = "HL7 EntityName"
    uri =  "http://hl7.org/codes/EntityName#"
    table = {
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

@OID_Library.register
class AdministrativeGender():
    oid = "2.16.840.1.113883.5.1"
    name = "HL7 AdministrativeGender"
    uri =  "http://hl7.org/codes/AdministrativeGender#"
    table = {
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

