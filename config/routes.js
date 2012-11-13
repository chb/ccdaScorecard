// Guide on [routing](http://locomotivejs.org/guide/routing.html)

module.exports = function routes() {
  this.root(function(req,res){res.redirect("/ui");});

  this.match('/ui*', 'auth#ensureProviderAuthenticated');
  this.match('/ui*', 'ccda_receiver#main');

  this.match('/abbi*', 'auth#ensurePatientAuthenticated');
  this.match('/abbi*', 'abbi#main');

  this.match('/auth/browserid', 'auth#browserid', {via: 'post'});
  this.match('/logout', 'auth#logout');


  this.match('/internal/searchForPatients', 'auth#ensureProviderAuthenticated');
  this.match('/internal/searchForPatients', 'patient#searchByTokens');
  this.match('/internal/getOnePatient/:pid', 'auth#ensureProviderAuthenticated');
  this.match('/internal/getOnePatient/:pid', 'patient#demographics');
  this.match('/internal/addPatient/:pid', 'patient#document', {via: 'post'});

  this.match('/patients/:pid*', 'auth#ensurePatientAccess', {via: 'all'});
  this.match('/patients/all/searchByTokens', 'patient#searchByTokens');

  this.match('/patients/:pid/:collection/:subcollection/:id/links', 
    'patient#links');

  this.match('/patients/:pid/documents/ccda/:id/raw',
    'patient#raw');

  this.match('/patients/:pid/:collection/:subcollection/:id', 
    'patient#entry');

  this.match('/patients/:pid/:collection/:subcollection', 
    'patient#entries');

  this.match('/patients/:pid', 'patient#demographics');
  
  this.match('/patients/:pid/documents/ccda', 
    'patient#document', {via:'post'});

  this.match('/auth/provider/launch-app', 'auth#findApp');
  this.match('/auth/provider/launch-app', 'auth#providerLaunch');

  this.match('/auth/patient/launch-app', 'auth#findApp');
  this.match('/auth/patient/launch-app', 'auth#patientLaunch');

  this.match('/auth/txn-details', 'auth#getOAuth2Transaction');
  this.match('/auth/decide', 'auth#decide', {via: 'post'});
};
