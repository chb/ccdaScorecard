angular.module('ccdaReceiver').controller("MainController", 
  function($rootScope, $route, $routeParams, $location){
    $rootScope.$on("$routeChangeSuccess", function(rc){
    });
    $rootScope.$on("$routeChangeStart", function(rc){
    });
  }
);


﻿angular.module('ccdaReceiver').controller("PatientSearchController",  
  function($scope, patient, patientSearch, $routeParams, $rootScope, $location) {
    $scope.loading = true;
    $scope.patients = [];
    $scope.nPerPage = 10;
    $scope.skip = 0;
    $scope.genderglyph = {"Female" : "&#9792;", "Male": "&#9794;"};
    $scope.searchterm  = typeof $routeParams.q ==="string" && $routeParams.q || "";
    $scope.nextPage = function(){
      if (!$scope.hasNext()) return;
      $scope.skip += $scope.nPerPage;
      $scope.getMore();
    };

    $scope.previousPage = function(){
      if (!$scope.hasPrevious()) return;
      $scope.skip -= $scope.nPerPage;
      $scope.getMore();
    };

    $scope.select = function(i){

      var pid = patient.id($scope.patients[i]);

      if ($scope.searchterm === $routeParams.q){
        $location.url("/ui/patient-selected/"+pid);
        return;
      }

      $location.search("q", $scope.searchterm);
      var off = $rootScope.$on("$routeUpdate", function(){
        $location.url("/ui/patient-selected/"+pid);
        off();
      });

    };

    $scope.givens = function(name){
      return name && name.givens.join(" ");
    };

    $scope.hasPrevious = function(){
      return $scope.skip > 0;
    };

    $scope.hasNext = function(){
      return $scope.patients.length === $scope.nPerPage;
    };

    $scope.$watch("searchterm", function(){
      var tokens = [];
      ($scope.searchterm || "").split(/\s/).forEach(function(t){
        tokens.push(t.toLowerCase());
      });
      $scope.tokens = tokens;
      $scope.skip = 0;
      $scope.getMore();
    });

    $scope.getMore = function(){
      patientSearch.search({
        "tokens": $scope.tokens, 
        "limit": $scope.nPerPage,
      "skip": $scope.skip})
      .success(function(patients){
        $scope.loading = false;
        $scope.patients = patients;
        $scope.blanks = [];
        for (var i = patients.length; i < $scope.nPerPage; i++){
          $scope.blanks.push({});
        }
        $scope.$apply();
      });
    };
  }
);


angular.module('ccdaReceiver').controller("PatientViewController",  
  function($scope, patient, patientSearch, $routeParams, $rootScope, $location) {
    $scope.patient = {};
    $scope.patientHelper = patient;
    $scope.patientView = function(){
      return ($scope.patient && angular.toJson($scope.patient, true));
    };

    $scope.givens = function(name){
      return name && name.givens.join(" ");
    };

    patientSearch.getOne($routeParams.pid).success(function(p){
      $scope.patient = p;
      $scope.$apply();
    });

  }
);


