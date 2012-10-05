// Guide on [routing](http://locomotivejs.org/guide/routing.html)

module.exports = function routes() {
  this.root(function(req,res){res.redirect("/ui");});

  this.match('/ui*', 'auth#ensureAuthenticated');
  this.match('/ui*', 'pages#main');

  this.match('/auth/browserid', 'auth#browserid', {via: 'post'});
  this.match('/logout', 'auth#logout');

//  this.match('/patients*', 'auth#ensureAuthenticated', {via: 'all'});

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
};
