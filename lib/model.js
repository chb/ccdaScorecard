var db = require('./db'),
mongoose = require('mongoose'),
Schema = mongoose.Schema;

var appSchema = Schema({
  _id: {type:String, required: true},
  name: {type: String, required: true},
  oauthClientType: {
    type: String,
    enum: ["public"],
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
    enum: ["record", "user", "admin"],
    required: true
  },
  index: {type: String, required: true},
  icon: {
    type: String,
    match: /\.(png|jpg|svg|gif)$/,
    required: true
  }
}, {versionKey: false});


var tokenSchema = Schema({
  _id: {type: String, required: true},
  app: {type: String, ref: 'App'},
  user: {type: String, ref: 'User'},
  created: {
    type: Date, 
    default: Date.now
  },
  expires: {
    type: Date, 
    default: function(){return Date.now() + 1000 * 60 * 5;}
  },
  restrictions: Schema.Types.Mixed
}, {versionKey: false});

var userSchema = Schema({
  _id: String,
  logins: Number,
  lastLogin: Date,
  roles: [{type: String, enum: ["patient", "provider", "admin"]}],
  recentPatients:[String]
}, {versionKey: false});

exports.App = db.auth.model('App', appSchema);
exports.Token = db.auth.model('Token', tokenSchema);
exports.User = db.auth.model('User', userSchema);
