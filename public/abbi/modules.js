angular.module('abbi', ['smartBox'], function($routeProvider, $locationProvider){

  $routeProvider.when('/abbi', {
    templateUrl:'/static/abbi/templates/stats.html',
    reloadOnSearch:false
  }) 

  $routeProvider.when('/abbi/sign-out', {
    templateUrl:'/static/abbi/templates/sign-out.html',
  });

   $routeProvider.when('/abbi/patient-selected/:pid', {
    templateUrl:'/static/abbi/templates/patient-selected.html',
  });

  $routeProvider.when('/abbi/authorize', {
    templateUrl:'/static/abbi/templates/authorize-app.html',
  });

  $locationProvider.html5Mode(true);

});
