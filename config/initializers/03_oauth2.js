var passport = require('passport')
, winston = require('winston')
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
    done(null, client._id);
  });

  server.deserializeClient(function(_id, done) {
    model.App.findOne({_id: _id}, function(err, client) {
      if (err) { return done(err); }
      return done(null, client);
    });
  });

  server.grant(oauth2orize.grant.token(function(client, user, ares, done) {
    winston.log("new token for ", user);

    var baseAuth = {
      app: client._id,
      user: user._id,
    }
    if (ares.patient){
      baseAuth.patient = ares.patient
    }

    model.Authorization.checkForPriorAuthorization(baseAuth, 
      function(err, newAuth){
        if (newAuth === false){
          newAuth = new model.Authorization(baseAuth);
          newAuth.save(generateToken);
        } else {
          generateToken(null, newAuth);
        }

        function generateToken(err, newAuth) {
          console.log(err, 'created/found auth', newAuth);
          var t = new model.Token({
            _id: uuid.v4(),
            authorization: newAuth._id,
            restrictions: ares 
          });

          t.save(function(err, t){
            if (err) { return done(err); }
            done(null, t._id);
          });
          console.log("Saving a new token!",  t);
        };

      });

  }));

  // bulk up the request representation by including the patient
  // alongside default parameters (parsed out by grant.token)
  server.grant("token", "request", function(req){
    return {
      patient: req.param("patient") 
    };
  });

  passport.use('oauth2Bearer', new BearerStrategy(
    function(accessToken, done) {
      model.Token.findOne({
        _id: accessToken,
        expires: {"$gt": new Date()}
      })
      .populate('authorization')
      .exec(function(err, token){
        winston.info("fetch " + token.authorization._id);
        model.Authorization.findOne({_id: token.authorization._id})
        .populate('user')
        .populate('app')
        .exec(function(err, authorization) {
          winston.info(err);
          winston.info("looked for"+ accessToken+ token+ authorization);
          if (err) { return done(err); }
          if (!token) { return done(null, false); }
          winston.log("A gret sucess", token);
          done(null, authorization.user, authorization);
        });
      });
    }));
};
