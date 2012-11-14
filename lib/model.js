var db = require('./db'),
mongoose = require('mongoose'),
Schema = mongoose.Schema;

var appSchema = Schema({
  _id: {type:String, required: true},
  name: {type: String, required: true},
  oauthClientType: {
    type: String,
    enum: ["public", "confidential"],
    required: true
  },
  description: {type: String, required: true},
  author: String,
  version: String,
  mode: {
    type: String, 
    enum: ["ui", "background"],
    required: true
  },
  scope: {
    type: String, 
    enum: ["patient", "user", "admin"],
    required: true
  },
  index: {type: String, required: true},
  icon: {
    type: String,
    match: /\.(png|jpg|svg|gif)$/,
    required: true
  }
}, {versionKey: false});

apiAccessSchema = Schema({
  app: {type: String, ref: 'App', required: true},
  user: {type: String, ref: 'User', required: true},
  time: {
    type: Date, 
    default: Date.now
  },
  url: {type: String, required: true},
  patient: {type: String}
}, {versionKey: false});

var tokenSchema = Schema({
  _id: {type: String, required: true},
  created: {
    type: Date, 
  default: Date.now
  },
  expires: {
    type: Date, 
  default: function(){return Date.now() + 1000 * 60 * 30;}
  },
  authorization: {type: Schema.ObjectId, ref: 'Authorization'}
}, {versionKey: false});

var userSchema = Schema({
  _id: String,
  logins: Number,
  lastLogin: Date,
  roles: [{type: String, enum: ["patient", "provider", "admin"]}],
  authorizedForPatients: [String],
  recentPatients:[String]
}, {versionKey: false});

var authorizationSchema = Schema({
  user: {type: String, ref: 'User'},
  app: {type: String, ref: 'App'},
  created: {
    type: Date, 
  default: Date.now
  },
  patient: {type: String}
}, {versionKey: false});

authorizationSchema.statics
.checkForPriorAuthorization = function(p, next){
  var conditions = {
    'app': p.app._id,
    'user': p.user._id,
    'patient': p.patient
  }

  this.findOne(conditions, function(err, match){
    console.log("prior auth", conditions, match);
    if (err){
      return next(err, null);
    }

    if (match){
      return next(null, match);
    }

    return next(null, false);
  });
};


exports.ApiAccess = db.auth.model('ApiAccess', apiAccessSchema);
exports.Authorization = db.auth.model('Authorization', authorizationSchema);
exports.App = db.auth.model('App', appSchema);
exports.User = db.auth.model('User', userSchema);
exports.Token = db.auth.model('Token', tokenSchema);
