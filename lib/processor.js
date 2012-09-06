var XDate = require("xdate");
var Processor = module.exports = {};

Processor.asString = function(v){
     return v.text && v.text() || v.value && v.value() || null;
};

Processor.asBoolean = function(v){
  return v==='true';
};

Processor.asFloat = function(v){
  return parseFloat(Processor.asString(v));
};

Processor.asTimestamp = function(v){
  var t = Processor.asString(v);

  if (t.indexOf('-') !== -1) {
    return;
  }
  var ret = new XDate(0,0,1,0,0,0,0, true); // UTC mode
  
  if (t.length >= 4)
    ret.setFullYear(parseInt(t.slice(0,4)));
  if (t.length >= 6)
    ret.setMonth(parseInt(t.slice(4,6))-1);
  if (t.length >= 8)
    ret.setDate(parseInt(t.slice(6,8)));
  if (t.length >= 10)
    ret.setHours(parseInt(t.slice(8,10)));
  if (t.length >= 12)
    ret.setMinutes(parseInt(t.slice(10,12)));
  if (t.length >= 14)
    ret.setSeconds(parseInt(t.slice(12,14)));

  return ret;
};

Processor.asTimestampResolution =  function(v){
  var t = Processor.asString(v);

  if (t.length===4)
    return 'year';
  if (t.length===6)
    return 'month';
  if (t.length===8)
    return 'day';
  if (t.length===10)
    return 'hour';
  if (t.length===12)
    return 'minute';
  if (t.length===14)
    return 'second';
  if (t.length > 14) {
    throw new Error(util.format("unexpected timestamp length %s:%s",t,t.length));
  }

  return 'subsecond';
};


