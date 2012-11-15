angular.module('abbi').controller("MainController", 
  function($rootScope, $route, $routeParams, $location){
  }
);

angular.module('abbi').controller("UserStatsController", 
  function($scope, $rootScope, $route, $routeParams, $location, patient, user){
    $scope.patients = [];
    $scope.authorizations = [];
    $scope.patientName = function(id){
      for (var i = 0; i < $scope.patients.length; i++){
        if (patient.id($scope.patients[i]) === id){
          return patient.name($scope.patients[i]);
        }
      }
      return "Patient " + id;
    };

    user.getPatients().then(function(patients){
      $scope.patients = patients;
      $scope.$apply();
    });

    user.getAuthorizations().then(function(aa){
      $scope.authorizations = aa;
      $scope.$apply();
    });
  }
);

angular.module('abbi').controller("SignOutController", 
  function(authorization){
    authorization.signOut();
    window.location = window.location;
  }
);

angular.module('abbi').controller("PatientSearchController",  
  function($scope, patient, patientSearch, $routeParams, $rootScope, $location, user) {
    $scope.patientHelper = patient;
    $scope.loading = true;
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
      $scope.onSelected($scope.patients[i]);
    };


    $scope.hasPrevious = function(){
      return $scope.skip > 0;
    };

    $scope.hasNext = function(){
      return $scope.patients.length === $scope.nPerPage;
    };

  }
);


angular.module('abbi').controller("PatientViewController",  
  function($scope, patient, patientSearch, $routeParams, $rootScope, $location) {
    $scope.patient = {};
    $scope.publicUri = publicUri;
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

angular.module('abbi').controller("AuthorizeAppController",  
  function($scope, authorization, patient, patientSearch, $routeParams, $rootScope, $location) {
    $scope.patientHelper = patient;
    $scope.patientName = "(choose below)";

    $scope.onSelected = function(p){
      $scope.patient = p;
      $scope.patientName = patient.name(p) ;
    };

    $scope.requestedScope = function(){
      if (!$scope.txn) {
        return null;
      }
      if (!$scope.txn.req.scope) {
        return "patient" // default scope
      }
      if ($scope.txn && $scope.txn.req.scope.indexOf("patient") !== -1){
        return "patient";
      }
      if ($scope.txn && $scope.txn.req.scope.indexOf("user") !== -1){
        return "user";
      }
      throw "Unrecognized scope";
    };

    $scope.needPatient = function(){
      return ($scope.requestedScope() === "patient" && 
      $scope.txn.req.patient === undefined);
    };

    $scope.decide = function(allow){
      var params = {};
      if ($scope.patient){
        params.patient = patient.id($scope.patient);
      }
      authorization.decide($scope.txn, allow, params);
    };

    $scope.allow = function(){
      $scope.decide(true);
    };

    $scope.deny = function(){
      $scope.decide(false);
    };

    authorization.transactionDetails($location.search().transaction_id)
    .success(function(t){
      $scope.txn = t;
      if (t.req.patient) {
        patientSearch.getOne(t.req.patient).success(function(p){
          $scope.patient = p;
          $scope.onSelected(p);
          $scope.$apply();
        });
      };
      $scope.$apply();
    });

  }
);
