import string
import random
import datetime

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

def RandomString(length=12, choices=[string.letters]):
  # FIXME: seed!
  return "".join([random.choice(''.join(choices)) for i in xrange(length)])
