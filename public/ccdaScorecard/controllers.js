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

    var Scorecard = $resource('/v1/ccda-scorecard/:res', {}, {
      rubrics: {method:'GET', params: {res: "rubrics"}},
      stats: {method:'GET', params: {res: "stats"}},
    });

    Scorecard.request = function(_, data) {

      var ret = {};
      $http({
        method: "POST",
        data: data,
        url: "/v1/ccda-scorecard/request",
        headers: {"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"}
      }).success(function(r){
        Object.keys(r).forEach(function(k){
          ret[k] = r[k];
        });
      });
      return ret;
    }

    var Example = $resource('', {}, {
      get: {method:'GET'}
    });

    $http({method: 'GET', url: '/static/ccdaScorecard/example.ccda.xml'})
    .success(function(data, status, headers, config) {
      $scope.example = data;
    });

    $scope.stats = Scorecard.stats();
    $scope.rubrics = Scorecard.rubrics();
    $scope.submission = "";

    $scope.example = "";

    $scope.getScore = function(){
      console.log("requesting", $scope);
      $scope.scorecard = Scorecard.request({}, $scope.submission.trim());
    };

    $scope.loading = function(){
      return (
        $scope.example.length == 0 || 
        Object.keys($scope.stats).length  ==  0 || 
        Object.keys($scope.rubrics).length == 0
      );
    }
  }
);
