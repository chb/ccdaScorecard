import sqlite3
from pymongo import Connection

connection = Connection()
db = connection.rxnorm

conn = sqlite3.connect('rxn.db')

def doQ(q):
    return [x[0] for x in conn.execute(q).fetchall()]

def instr(l):
    return "('"+"','".join(l) +"')"

def toing(rxcui, tty):
    ret = []
    for v in rxcui:
        ret.extend(toing_helper(v, tty))
    return set(ret)

def toing_helper(rxcui, tty):
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
        return toing(doQ("select rxcui1 from rxnrel where rxcui2='%s' and rela='tradename_of'"%rxcui), 'SCDF')

    if tty=='SCDG':
        return doQ("select rxcui1 from rxnrel where rxcui2 ='%s' and rela='has_ingredient'"%rxcui)

    if tty=='SBDG':
        return toing(doQ("select rxcui1 from rxnrel where rxcui2='%s' and rela='tradename_of'"%rxcui), 'SCDG')

    if tty=='SBDC':
        return toing(doQ("select rxcui1 from rxnrel where rxcui2='%s' and rela='tradename_of'"%rxcui), 'SCDC')

    if tty=='SCDC':
        return doQ("select rxcui1 from rxnrel where rxcui2 ='%s' and rela='has_ingredient'"%rxcui)

    if tty=='SBD':
        return toing(doQ("select rxcui1 from rxnrel where rxcui2='%s' and rela='tradename_of'"%rxcui), 'SCD')

    if tty=='SCD':
        return toing(doQ("select rxcui1 from rxnrel where rxcui2='%s' and rela='consists_of'"%rxcui), 'SCDC')

    if tty=='BPCK' or tty=='GPCK':
        return toing(doQ("select rxcui1 from rxnrel where rxcui2='%s' and rela='contains'"%rxcui), 'SCD')

"""
print toing(['369070'], 'SBDF')
print toing(['901813'], 'SCDC')
print toing(['209459'], 'SBD')
print toing(['214181'], 'MIN')
print toing(['203150'], 'PIN')
print toing(['58930'], 'BN')
print toing(['1092412'], 'BPCK')
print toing(['1093075'], 'SCD')

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
    ii = toing([c[0]], c[1])
    label = conn.execute("select str from rxnconso where SAB='RXNORM' and TTY in %s and rxcui='%s'"%(instr(drug_types), c[0])).fetchone()[0]
    r = {
        '_id': c[0],
        'label': label,
        'type': c[1],
        'ingredients':list(ii)
    }
    print r
    db.concepts.insert(r)
