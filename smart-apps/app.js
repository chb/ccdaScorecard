var express = require('express'),
twinlist = require('./twinlist'),
path = require('path');

app = express(); 
twinlist(app);
app.use('/apps', express.static(path.join(__dirname, 'public')));
app.listen(process.env.VMC_APP_PORT || 3001);
