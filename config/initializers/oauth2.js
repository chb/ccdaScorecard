var passport = require('passport')
, winston = require('winston')
, config = require('../index')
, BearerStrategy = require('passport-http-bearer').Strategy
, model = require('../../lib/model.js')
, uuid = require('node-uuid')
, ObjectID = require('mongodb').ObjectID
, oauth2orize = require('oauth2orize')
, transactionLoader = require('../../node_modules/oauth2orize/lib/middleware/transactionLoader');

var app = config.app;

var server = oauth2orize.createServer();
server.loadTransaction = transactionLoader(server);
app.set('oauth2server', server);

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
  winston.info("new token for ", user);

  var baseAuth = {
    app: client._id,
    user: user._id,
    patient: "all"
  }

  if (ares.patient){
    baseAuth.patient = ares.patient;
  }

  model.Authorization.findOneAndUpdate(
 // workaroud https://jira.mongodb.org/browse/SERVER-1351
    {_id: JSON.stringify(baseAuth)},
    {"$set": baseAuth},
    {upsert: true},
    function(err, newAuth){
        if (err){
          throw new Error("Couldn't create an authorization: " + err);
        }
        winston.info('created/found auth'+ newAuth);
        var t = new model.Token({
          _id: uuid.v4(),
          authorization: newAuth._id,
          restrictions: ares 
        });

        t.save(function(err, t){
          if (err) { return done(err); }
          done(null, t._id);
        });
        winston.info("Saving a new token!"+ t);
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
        winston.info("A gret sucess", token);
        done(null, authorization.user, authorization);
      });
    });
  }));
