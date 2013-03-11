angular.module('ccdaScorecard', ['ngResource'], function($routeProvider, $locationProvider){

  $routeProvider.when('/', {
    templateUrl:'/static/ccdaScorecard/templates/index.html',
    controller: 'MainController'
  }) 

  $routeProvider.when('/static/ccdaScorecard/', {
    templateUrl:'/static/ccdaScorecard/templates/index.html',
    controller: 'MainController'
  }) 

  //  $locationProvider.html5Mode(true);
  console.log("Started module");
});

angular.module('ccdaScorecard').factory('Scorecard', function($resource, $http) {


  // Resource to fetch data for interpreting / calculating scores.
  // TODO: abstract this into a service when we have >1 controller.
  var Scorecard = $resource('/v1/ccda-scorecard/:res', {}, {
    rubrics: {method:'GET', params: {res: "rubrics"}},
    stats: {method:'GET', params: {res: "stats"}},
  });

  // simulate a `request` method because ng's $resource doesn't (yet)
  // support custom headers or explicit Content-type.
  Scorecard.request = function(_, data) {
    var ret = [];
    $http({
      method: "POST",
      data: data,
      url: "/v1/ccda-scorecard/request?example="+_.isExample,
      headers: {"Content-Type": "application/x-www-form-urlencoded"}
    }).success(function(r){
      for (var i = 0; i < r.length; i++){
        ret.push(r[i]);
      }
    });
    return ret;
  }

  // ng's $resource can't grab a single string except to treat it 
  // as a character array... so we do this the old-fashioned way, too.
  Scorecard.getExample = function($scope) {
    $http({method: 'GET', url: '/static/ccdaScorecard/example.ccda.xml'})
    .success(function(data, status, headers, config) {
      console.log("got example");
      $scope.example = data;
    });
    return "";
  }

  Scorecard.rubrics = Scorecard.rubrics();
  Scorecard.stats = Scorecard.stats();

  return Scorecard;
});

angular.module('ccdaScorecard').controller("ScoreController",  
  function($scope, Scorecard) {

    $scope.$on("expandRequest", function(e, state){
      $scope.showDetails = state;
    });

    var rubric = $scope.rubric = Scorecard.rubrics[$scope.score.rubric];
    console.log("r", rubric);

    $scope.cssClass = function(){
      var score = $scope.score.score;
      var max = rubric.maxPoints;
      if (score === max){return "success";}
      else if (score ===0) {return "error";}
      return "warning";
    };

    $scope.showDetails = true;
  }
);

angular.module('ccdaScorecard').controller("MainController",  
  function($scope, Scorecard) {

    $scope.stats = Scorecard.stats;
    $scope.rubrics = Scorecard.rubrics;
    $scope.example = Scorecard.getExample($scope);

    $scope.getScore = function(){

      console.log("requesting", $scope);
      var toSubmit = $scope.submission.trim();

      $scope.scores = Scorecard.request({
        isExample: (toSubmit === $scope.example.trim())
      }, toSubmit);

      $scope.scoring = true;
    };

    $scope.expandAllScores = function(){$scope.$broadcast("expandRequest", true);};
    $scope.collapseAllScores = function(){$scope.$broadcast("expandRequest", false);};

    function parseSections(scoreList){
      var sections = {}, ret = [];

      for (var i = 0; i < scoreList.length; i++) {
        var score = scoreList[i];
        var sectionName = $scope.rubrics[score.rubric].category[0];
        (sections[sectionName] || (sections[sectionName] = [])).push(score);
      }; 


      var overallPoints = 0;
      var overallMaxPoints = 0;

      Object.keys(sections).sort().forEach(function(k){

        sections[k] = sections[k].sort(function(a,b){
          return a.rubric === b.rubric ? 0 : a.rubric < b.rubric ? -1 : 1;
        });

        var section = {
          name: k,
          scores: sections[k]
        };

        var sectionPoints = 0;
        var sectionMaxPoints = 0;

        section.scores.forEach(function(s){
          if (s.doesNotApply) {
            return;
          }
          sectionPoints += s.score;
          overallPoints += s.score;
          sectionMaxPoints += $scope.rubrics[s.rubric].maxPoints;
          overallMaxPoints += $scope.rubrics[s.rubric].maxPoints;
        });

        if (sectionMaxPoints === 0){
          section.percent = null;
        } else { 
          section.percent = parseInt(100 * sectionPoints / sectionMaxPoints);
        }
        ret.push(section);
      });

      $scope.overallPercent = parseInt(100 * overallPoints / overallMaxPoints);

      return ret;

    }

    $scope.$watch("scores", function(scores){
      if (!scores || scores.length == 0) return;
      $scope.scoring = false;
      $scope.scoreSections = parseSections(scores);
    }, true);

    $scope.loading = function(){
    console.log($scope.rubrics);
      var ret = (
        $scope.example.length == 0 || 
        Object.keys($scope.rubrics).length == 0
      );
      return ret;
    }

    $scope.showDetails = function(score){
      score.showDetails = true;
    };

  }
);

angular.module('ccdaScorecard')
.directive('statsHistogram', function($timeout, dateFilter) {
  // return the directive link function. (compile function not needed)
  return {
    restrict: 'C',
    scope:  {distribution: '='},
    link: function(scope, element, attrs) {
      // A formatter for counts.
      console.log("Linking histogram");

      var formatCount = d3.format(",.0f");

      var margin = {
        left: 40,
        right: 40
      }

      var dim = {
        width: 150,
        barHeight: 20
      };


      function makeHistogram(scores) {
        console.log("making histogram", element);
        var scoreKeys = Object.keys(scores).sort().reverse();

        var scoreArray = scoreKeys.map(function(k){
          return scores[k];
        });

        angular.element(element).text("");
        var bounding = d3.select(element[0]).append("svg")
        .attr("width", dim.width)
        .attr("class", "chart")
        .attr("height", dim.barHeight * scoreArray.length);

        var chart =bounding.append("g")
        .attr("transform", "translate(" + margin.left + "," + 0 + ")");

        var x = d3.scale.linear()
        .domain([0, d3.max(scoreArray)])
        .range([0, dim.width - margin.left - margin.right]);

        chart.selectAll("rect")
        .data(scoreKeys)
        .enter().append("rect")
        .attr("y", function(d, i) { return i * dim.barHeight; })
        .attr("width", function(d){return x(scores[d]);})
        .attr("height", dim.barHeight);

        bounding.selectAll("line")
        .data(scoreKeys)
        .enter().append("line")
        .attr("y1", function(d, i) { return (i+.5) * dim.barHeight; })
        .attr("y2", function(d, i) { return (i+.5) * dim.barHeight; })
        .attr("x1", function(d, i) { return margin.left-2  })
        .attr("x2", function(d, i) { return margin.left+2; });

        chart.selectAll("text.barlen")
        .data(scoreKeys).enter()
        .append("text")
        .attr("class", "barlen")
        .attr("dy", ".35em")
        .attr("y", function(d, i) { return (i+0.5) * dim.barHeight; })
        .attr("x", function(d){return x(scores[d])+2;})
        .attr("text-anchor", "beginning").text(function(d) { return formatCount(scores[d]); });

        bounding.selectAll("text.barLabel")
        .data(scoreKeys)
        .enter().append("text")
        .attr("class", "barLabel")
        .attr("dy", ".35em")
        .attr("y", function(d, i) { return (i+0.5) * dim.barHeight; })
        .attr("x", margin.left-2)
        .attr("text-anchor", "end")
        .text(function(d){
          if (isNaN(parseInt(d))) return d;
          return d + " pts";
        });

      };

      //      element.text("");
      // watch the expression, and update the UI on change.
      scope.$watch('distribution', function(value, oldval) {
        console.log("REplacing", element, element.text());
        makeHistogram(value);
      }, false);

    }
  };
});

angular.module('ccdaScorecard')
.directive('tweetButton', function($timeout, dateFilter) {
  // return the directive link function. (compile function not needed)
  return {
    restrict: 'AE',
    scope:  {score: '@'},
    link: function(scope, element, attrs) {
      // A formatter for counts.
      scope.$watch("score", function(newScore){
        if (typeof twttr === "undefined") return;
        var score = attrs.score;
        var origin = window.location.protocol + "//" + window.location.host;
        if (window.location.port == "80" || window.location.port == "443") {
          origin = origin.replace(/\:.*/,"");
        }
        element.html('<a href="https://twitter.com/share" class="twitter-share-button" data-text="My C-CDA scored '+newScore+'% on the SMART C-CDA Scorecard!" data-url="'+origin+'" data-via="SMARTHealthIT" data-size="large" data-hashtags="HealthIT" data-dnt="true">Tweet your score</a>');      
          twttr.widgets.load();
      });
    }
  };
});

angular.module('ccdaScorecard')
.directive('scrollIf', function () {
  return function (scope, element, attributes) {
    scope.$watch(attributes.scrollIf, function(v, old){
      if (scope.$eval(attributes.scrollIf)) {
        window.setTimeout(function(){
          element.ScrollTo({duration: 200, offsetTop: 30})
        }, 0);
      }
    });
  }
});
