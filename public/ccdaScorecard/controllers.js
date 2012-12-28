angular.module('ccdaScorecard', ['ngResource'], function($routeProvider, $locationProvider){
  $routeProvider.when('/static/ccdaScorecard/', {
    templateUrl:'/static/ccdaScorecard/templates/index.html',
    controller: 'MainController'
  }) 

  $locationProvider.html5Mode(true);
  console.log("Started mdoule");
});

angular.module('ccdaScorecard').controller("MainController",  
  function($scope, $route, $routeParams, $rootScope, $resource, $http) {

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
        url: "/v1/ccda-scorecard/request",
        headers: {"Content-Type": "application/x-www-form-urlencoded"}
      }).success(function(r){
        console.log("got a req", r);
        for (var i = 0; i < r.length; i++){
          ret.push(r[i]);
        }
      });
      return ret;
    }

    // ng's $resource can't grab a single string except to treat it 
    // as a character array... so we do this the old-fashioned way, too.
    Scorecard.getExample = function() {
      $http({method: 'GET', url: '/static/ccdaScorecard/example.ccda.xml'})
      .success(function(data, status, headers, config) {
        console.log("got example");
        $scope.example = data;
      });
      return "";
    }

    $scope.stats = Scorecard.stats();
    $scope.rubrics = Scorecard.rubrics();
    $scope.example = Scorecard.getExample();

    $scope.getScore = function(){
      console.log("requesting", $scope);
      $scope.scores = Scorecard.request({}, $scope.submission.trim());
    };


    function parseSections(scoreList){
      var sections = {}, ret = [];

      for (var i = 0; i < scoreList.length; i++) {
        var score = scoreList[i];
        var sectionName = $scope.rubrics[score.rubric].category[0];
        (sections[sectionName] || (sections[sectionName] = [])).push(score);
      }; 

      Object.keys(sections).sort().forEach(function(k){
        ret.push({
          name: k,
          scores: sections[k]
        });
      });

      return ret;

    }

    $scope.$watch("scores", function(scores){
      if (!scores) return;

      $scope.scoreSections = parseSections(scores);
    }, true);

    $scope.loading = function(){
      return (
        $scope.example.length == 0 || 
        Object.keys($scope.stats).length  ==  0 || 
        Object.keys($scope.rubrics).length == 0
      );
    }

    $scope.cssClassFor = function(score){
      var max = $scope.rubrics[score.rubric].maxPoints;
      if (score.score === max){return "success";}
      else if (score.score ===0) {return "error";}
      return "warning";
    };

    $scope.showDetails = function(score){
      score.showDetails = true;
    };

  }
);

angular.module('ccdaScorecard')
.directive('statsHistogram', function($timeout, dateFilter) {
  // return the directive link function. (compile function not needed)
  return {
    restrict: 'A',
    scope:  {distribution: '='},
    link: function(scope, element, attrs) {
      // A formatter for counts.

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
        var scoreKeys = Object.keys(scores).sort();

        var scoreArray = scoreKeys.map(function(k){
          return scores[k];
        });

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

      var inside = angular.element("<div>Another elemnt here</div>");

      element.text("");
      // watch the expression, and update the UI on change.
      scope.$watch('distribution', function(value, oldval) {
        element.text("");
        makeHistogram(value);
      }, false);

    }
  };
});
