var db = require('./db');
var mongoose = require('mongoose');

var appSchema = mongoose.Schema({
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

exports.App = db.auth.model('App', appSchema);

