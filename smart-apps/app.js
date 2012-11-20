var express = require('express'),
twinlist = require('./twinlist'),
path = require('path');

app = express(); 
app.use (function(req, res, next) {
  req.rawBody = '';
  req.setEncoding('utf8');
  req.on('data', function(chunk) { req.rawBody += chunk });
  next();
});

app.use(express.bodyParser());

twinlist(app);
app.use('/apps', express.static(path.join(__dirname, 'public')));
app.listen(process.env.VMC_APP_PORT || 3001);
