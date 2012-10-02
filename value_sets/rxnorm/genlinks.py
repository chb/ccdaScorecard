import json
import sqlite3
from pymongo import Connection

connection = Connection()
db = connection.rxnorm

conn = sqlite3.connect('rxn.db')

def doQ(q):
    ret= [x[0] for x in conn.execute(q).fetchall()]
    return ret

def instr(l):
    return "('"+"','".join(l) +"')"

def toBrandAndGeneric(rxcuis, tty):
    ret = []
    for rxcui in rxcuis:
        ret.extend(doQ("select rxcui1 from rxnrel where rela='tradename_of' and rxcui2='%s' """%rxcui))
    return ret 

def toComponents(rxcuis, tty):
    ret = []

    if tty not in ("SBD", "SCD"):
        return ret

    for rxcui in rxcuis:
        cs = doQ("select rxcui1 from rxnrel where rela='consists_of' and rxcui2='%s' """%rxcui)
        for c in cs:
            ret.extend(doQ("select rxcui from rxnconso where sab='RXNORM' and tty='SCDC' and rxcui='%s'"%c))        

    return set(ret)

def toTreatmentIntents(rxcuis, tty):
    ret = []
    for v in rxcuis:
        ret.extend(toTreatmentIntents_helper(v, tty))
    return set(ret)

def toTreatmentIntents_helper(rxcui, tty):
    assert tty=='IN'
    ret = []
    rxauis = doQ("select rxaui from rxnconso where tty='FN' and sab='NDFRT' and rxcui='%s'"%rxcui)
    for a in rxauis:
        a1 = doQ("select rxaui1 from rxnrel where rxaui2='%s' and rela='may_treat'"%a)
        if len(a1)>0:
            dz = doQ("select str from rxnconso c where c.tty='FN' and c.sab='NDFRT' and rxaui='%s'"%a1[0])
            dz = map(lambda x: x.replace(" [Disease/Finding]", ""), dz)
            ret.extend(dz)
    return ret

def toMechanism(rxcuis, tty):
    ret = []
    for v in rxcuis:
        ret.extend(toMechanism_helper(v, tty))
    return set(ret)

def toMechanism_helper(rxcui, tty):
    assert tty=='IN'
    ret = []
    rxauis = doQ("select rxaui from rxnconso where tty='FN' and sab='NDFRT' and rxcui='%s'"%rxcui)
    for a in rxauis:
        a1 = doQ("select rxaui1 from rxnrel where rxaui2='%s' and rela='has_mechanism_of_action'"%a)
        if len(a1)>0:
            moa = doQ("select str from rxnconso c where c.tty='FN' and c.sab='NDFRT' and rxaui='%s'"%a1[0])
            moa = map(lambda x: x.replace(" [MoA]", ""), moa)
            ret.extend(moa)
    return ret


def toIngredients(rxcuis, tty):
    ret = []
    for v in rxcuis:
        ret.extend(toIngredients_helper(v, tty))
    return set(ret)

def toIngredients_helper(rxcui, tty):
    if tty=='IN': return [rxcui]
    
    if tty=='MIN': 
        return doQ("select rxcui1 from rxnrel where rxcui2 ='%s' and rela='has_part'"%rxcui)
 
    if tty=='PIN': 
        return doQ("select rxcui1 from rxnrel where rxcui2 ='%s' and rela='form_of'"%rxcui)

    if tty=='BN':
        return doQ("select rxcui1 from rxnrel where rela='tradename_of' and rxcui2='%s' """%rxcui)

    if tty=='SCDF':
        return doQ("select rxcui1 from rxnrel where rxcui2 ='%s' and rela='has_ingredient'"%rxcui)

    if tty=='SBDF':
        return toIngredients(doQ("select rxcui1 from rxnrel where rxcui2='%s' and rela='tradename_of'"%rxcui), 'SCDF')

    if tty=='SCDG':
        return doQ("select rxcui1 from rxnrel where rxcui2 ='%s' and rela='has_ingredient'"%rxcui)

    if tty=='SBDG':
        return toIngredients(doQ("select rxcui1 from rxnrel where rxcui2='%s' and rela='tradename_of'"%rxcui), 'SCDG')

    if tty=='SBDC':
        return toIngredients(doQ("select rxcui1 from rxnrel where rxcui2='%s' and rela='tradename_of'"%rxcui), 'SCDC')

    if tty=='SCDC':
        return doQ("select rxcui1 from rxnrel where rxcui2 ='%s' and rela='has_ingredient'"%rxcui)

    if tty=='SBD':
        return toIngredients(doQ("select rxcui1 from rxnrel where rxcui2='%s' and rela='tradename_of'"%rxcui), 'SCD')

    if tty=='SCD':
        return toIngredients(doQ("select rxcui1 from rxnrel where rxcui2='%s' and rela='consists_of'"%rxcui), 'SCDC')

    if tty=='BPCK' or tty=='GPCK':
        return toIngredients(doQ("select rxcui1 from rxnrel where rxcui2='%s' and rela='contains'"%rxcui), 'SCD')

"""
print toIngredients(['369070'], 'SBDF')
print toIngredients(['901813'], 'SCDC')
print toIngredients(['209459'], 'SBD')
print toIngredients(['214181'], 'MIN')
print toIngredients(['203150'], 'PIN')
print toIngredients(['58930'], 'BN')
print toIngredients(['1092412'], 'BPCK')
print toIngredients(['1093075'], 'SCD')

OCD	Obsolete clinical drug	295942
SY	Designated synonym	47804
SCD	Semantic Clinical Drug	33725
SCDC	Semantic Drug Component	25774
TMSY	Tall Man synonym	22764
SBDG	Semantic branded drug group	22286
SBD	Semantic branded drug	21011
SBDC	Semantic Branded Drug Component	18885
BN	Fully-specified drug brand name that can not be prescribed	15685
SBDF	Semantic branded drug and form	15456
SCDG	Semantic clinical drug group	14793
SCDF	Semantic clinical drug and form	13951
IN	Name for an ingredient	5017
MIN	name for a multi-ingredient	3734
PIN	Name from a precise ingredient	1570
BPCK	Branded Drug Delivery Device	443
GPCK	Generic Drug Delivery Device	391
DF	Dose Form	155
DFG	Dose Form Group	21
ET	Entry term	20
"""
drug_types = ['SCD', 'SCDC', 'SBDG', 'SBD', 'SBDC', 'BN', 'SBDF', 'SCDG', 'SCDF', 'IN', 'MIN', 'PIN', 'BPCK', 'GPCK']

cs=conn.execute("select RXCUI, TTY from RXNCONSO where SAB='RXNORM' and TTY in %s"%instr(drug_types))

db.concepts.remove({})
while True:
    c = cs.fetchone()
    if c == None: break
    ii = toIngredients([c[0]], c[1])
    label = conn.execute("select str from rxnconso where SAB='RXNORM' and TTY in %s and rxcui='%s'"%(instr(drug_types), c[0])).fetchone()[0]
    r = {
        '_id': c[0],
        'label': label,
        'type': c[1],
        'ingredients':list(ii),
        'generics': list(toBrandAndGeneric([c[0]], c[1])),
        'components': list(toComponents([c[0]], c[1])),
#        'mechanisms': list(toMechanism(ii, "IN")),
        'treatmentIntents': list(toTreatmentIntents(ii, "IN"))
    }
    print json.dumps(r, sort_keys=True, indent=2)
    db.concepts.insert(r)
