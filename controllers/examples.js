var Controller = module.exports = {};

var request = require('request');

var ghreq = function(){
  var tags = {};
  var bodies = {};

  return function(url, cb){
    request.get({
      url: url,
      headers: {
        "If-None-Match": tags[url] 
      }
    }, function(err, response, body){

      tags[url] = response.headers["etag"];

      if (response.statusCode !== 304){
        bodies[url] = body;
        console.log("Save result in cache");
      }

      return cb(err, response, bodies[url]);
    })
  };
}();

Controller.list = function(req, res, next){
  var url = 'https://api.github.com/repos/chb/sample_ccdas/git/trees/master?recursive=1';
  ghreq(url, function(err, response, body) {
    if (err) {
      next(err);
    } else {
      res.setHeader('Content-Type', 'application/json')
      res.end(body);
    }
  });  
};

Controller.fetch = function(req, res, next){
  // Hash should be nothing but a hex value
  var hash = req.params.id.replace(/[^a-f0-9]/g, '');
  if (hash !== req.params.id){
    err("Invalid file id: " + req.params.id);
  }
  ghreq('https://api.github.com/repos/chb/sample_ccdas/git/blobs/' + hash,
    function(err, response, body) {
      if (err) {
        return next(err);
      }
      res.setHeader('Content-Type', 'application/xml')
      res.end(new Buffer(JSON.parse(body).content, 'base64').toString());
    });  
};
