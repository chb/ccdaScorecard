angular.module('ccdaReceiver', ['smartBox'], function($routeProvider, $locationProvider){

  $routeProvider.when('/ui/select-patient', {
    templateUrl:'/static/ccdaReceiver/templates/select-patient.html',
    reloadOnSearch:false
  }) 

  $routeProvider.when('/ui', {redirectTo:'/ui/select-patient'});

  $routeProvider.when('/ui/patient-selected/:pid', {
    templateUrl:'/static/ccdaReceiver/templates/patient-selected.html',
  });

  $routeProvider.when('/ui/authorize', {
    templateUrl:'/static/ccdaReceiver/templates/authorize-app.html',
  });

  $locationProvider.html5Mode(true);

});
