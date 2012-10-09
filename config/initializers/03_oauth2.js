var passport = require('passport')
, config = require('../config')
, BearerStrategy = require('passport-http-bearer').Strategy
, model = require('../../lib/model.js')
, uuid = require('node-uuid')
, oauth2orize = require('oauth2orize')
, transactionLoader = require('../../node_modules/oauth2orize/lib/middleware/transactionLoader');


module.exports = function(){ 
  var server = oauth2orize.createServer();
  server.loadTransaction = transactionLoader(server);
  this.set('oauth2server', server);

  server.serializeClient(function(client, done) {
     done(null, "clientid="+client._id);
  });

  server.deserializeClient(function(_id, done) {
    model.App.findOne(_id, function(err, client) {
      if (err) { return done(err); }
      return done(null, client);
    });
  });

  server.grant(oauth2orize.grant.token(function(client, user, ares, done) {
    var t = new model.Token({
      _id: uuid.v4(),
      app: client._id,
      user: user._id,
      restrictions: ares
    });

    t.save(function(err, t){
      if (err) { return done(err); }
      done(null, t._id);
    });

  }));

  server.grant("token", "request", function(req){
    return {
      patient: req.param("patient") 
      };
  });

   passport.use(new BearerStrategy(
    function(accessToken, done) {
      model.Token.findOne(accessToken)
      .populate('user')
      .populate('app')
      .exec(function(err, token) {
        if (err) { return done(err); }
        if (!token) { return done(null, false); }
        done(null, user, token);
    });
    }));
};
