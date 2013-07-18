var config = require('./config');
var app = config.app;

app.get('/', function(req,res){
  res.redirect("/static/ccdaScorecard");
});

var Scorecard = require('./controllers/ccda_scorecard');
var Examples = require('./controllers/examples');

app.post('/v1/ccda-scorecard/request/?', Scorecard.gradeRequest);
app.get('/v1/ccda-scorecard/rubrics/?', Scorecard.rubricAll);
app.get('/v1/ccda-scorecard/rubrics/:rid', Scorecard.rubricOne);
app.get('/v1/ccda-scorecard/stats/?', Scorecard.statsAll);
app.get('/v1/ccda-scorecard/stats/:rid', Scorecard.statsOne);
app.get('/v1/examples/?', Examples.list)
app.get('/v1/examples/:id', Examples.fetch)
