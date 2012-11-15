var passport = require('passport');
var config = require('../index');
var app = config.app;

var Auth = require('../../app/controllers/auth_controller');
var CCDA = require('../../app/controllers/ccda_receiver_controller');
var ABBI = require('../../app/controllers/abbi_controller');
var Patient = require('../../app/controllers/patient_controller');

app.get('/', function(req,res){ res.redirect("/ui"); });

app.post('/auth/browserid', 
  passport.authenticate('browserid'), 
  Auth.browseridresponse
);

app.all('/ui*', 
  Auth.needLogin('ccda_receiver/login'), 
  Auth.needProvider('ccda_receiver/login'), 
  CCDA.main
);

app.all('/abbi*', 
  Auth.needLogin('abbi/login'), 
  Auth.needPatient(ABBI.wrongRole),
  ABBI.main
);

app.all('/logout', Auth.logout);

app.all('/internal/searchForPatients', 
  Auth.needLogin(),
  Patient.searchByTokens
);

app.get('/internal/getPatients/:uid', 
  Auth.needLogin(),
  Auth.needUserMatch,
  Patient.batchDemographics
);

app.get('/internal/getAuthorizations/:uid', 
  Auth.needLogin(),
  Auth.needUserMatch,
  Auth.getAuthorizations
);

app.get('/internal/getOnePatient/:pid', 
  Auth.needLogin(),
  Auth.needPatientAccess,
  Patient.demographics
);

app.post('/internal/addPatient/:pid', Patient.document);

app.all('/patients/:pid*', Auth.tokenHasPatientAccess);

app.get('/patients/all/searchByTokens', Patient.searchByTokens);
app.get('/patients/:pid/:collection/:subcollection/:id/links', 
  Patient.links);

app.get('/patients/:pid/documents/ccda/:id/raw', Patient.raw);
app.get('/patients/:pid/:collection/:subcollection/:id', Patient.entry);
app.get('/patients/:pid/:collection/:subcollection', Patient.entries);
app.get('/patients/:pid', Patient.demographics);
app.post('/patients/:pid/documents/ccda', Patient.document);

app.get('/auth/provider/launch-app', Auth.launch('/ui/authorize'));
app.get('/auth/patient/launch-app',  Auth.launch('/abbi/authorize'));

app.get('/auth/txn-details', Auth.getOAuth2Transaction);
app.post('/auth/decide', Auth.decide);

