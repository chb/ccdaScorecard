angular.module('abbi', [], function($routeProvider, $locationProvider){

  $routeProvider.when('/abbi/select-patient', {
    templateUrl:'/static/ccdaReceiver/templates/select-patient.html',
    reloadOnSearch:false
  }) 

  $routeProvider.when('/abbi', {redirectTo:'/abbi/select-patient'});

  $routeProvider.when('/abbi/patient-selected/:pid', {
    templateUrl:'/static/ccdaReceiver/templates/patient-selected.html',
  });

  $routeProvider.when('/abbi/authorize', {
    templateUrl:'/static/ccdaReceiver/templates/authorize-app.html',
  });

  $locationProvider.html5Mode(true);

});


